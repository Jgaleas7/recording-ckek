import cron from 'node-cron';
import { supabase } from '../db.js';
import axios from 'axios';

/**
 * Constants and configurations
 */
const CAPTURE_API_URL = `http://localhost`;
const RENAME_API_URL = 'http://localhost:5000/api/files/rename'
const TIMEZONE = 'America/Tegucigalpa';

// Task registry to manage active schedules by taskId
const taskRegistry = new Map();

/**
 * Helper functions to keep code DRY and maintainable
 */
const formatCronPattern = (time, day) => {
  const [hour, minute, second = '0'] = time.split(':');
  return `${second} ${minute} ${hour} * * ${day}`;
};

const logError = (context, error) => {
  console.error(`[${new Date().toISOString()}] Error en ${context}:`, error?.message || error);
};

const updateCapturerStatus = async (capturer, isActive, recordId = null) => {
  try {
    const { status, error } = await supabase
      .from('capturers')
      .update({
        is_active: isActive,
        is_automatic: isActive,
        record_active_id: recordId,
      })
      .eq('name', capturer.name);

    if (status !== 204) {
      throw new Error(error?.message || 'Unknown error updating capturer status');
    }

    return { success: true };
  } catch (error) {
    logError('updateCapturerStatus', error);
    return { success: false, error };
  }
};

const renameFile = async (capturer, nameOfFile) => {
  try {
    const res = await axios.post(`${RENAME_API_URL}/${capturer?.name}`, {
      FileName: `${nameOfFile}.mp4`,
      NewFileName: `${nameOfFile}.mp4`
    });

    if (res.status !== 200) throw new Error('Unknown error renaming file');

    return { success: true };
  } catch (error) {
    logError('renameFileStatus', error);
    return { success: false, error };
  }
};

const controlCapture = async (action, params = {}, capturer) => {
  try {
    const port = capturer?.name === "capturer1" ? 18080 : 19081;
    const baseURL = `${CAPTURE_API_URL}:${port}`;
    if (action === 'start') {
      try {
        // Intentar detener cualquier captura en curso
        await axios.post(`${baseURL}/stop-capture`);
      } catch (stopError) {
        // Si hay un error 400, significa que no había grabación en curso, lo cual está bien
        if (stopError.response && stopError.response.status === 400) {
          console.log('No había grabación en curso para detener, continuando...');
        } else {
          // Si es otro tipo de error, registrarlo pero continuar
          logError('controlCapture (stop before start)', stopError);
        }
      }
      // Continuar con el inicio de la captura independientemente del resultado del stop
      return await axios.get(`${baseURL}/start-capture`);
    } else if (action === 'stop') {
      try {
        return await axios.post(`${baseURL}/stop-capture`, params);
      } catch (stopError) {
        // Si hay un error 400, significa que no había grabación en curso
        if (stopError.response && stopError.response.status === 400) {
          console.log('No había grabación en curso para detener');
          return { status: 200, data: { message: 'No recording was in progress' } };
        }
        throw stopError; // Re-lanzar otros errores
      }
    }
  } catch (error) {
    logError(`controlCapture (${action})`, error);
    throw error;
  }
};

/**
 * Schedules the start of a recording task
 */
const scheduleStartTask = (task, capturer) => {
  const { id, day, name, start_at } = task;

  const cronPattern = formatCronPattern(start_at, day);

  const taskFunction = async () => {
    try {
      // Check if task is still valid
      const { data, error } = await supabase
        .from('records')
        .select('id')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.log(`Task ${id} no longer exists, skipping execution`);
        return;
      }

      await controlCapture('start', {}, capturer);
      const result = await updateCapturerStatus(capturer, true, id);

      if (result.success) {
        console.log(`Running task "${name}" on ${day} at ${start_at}`);
      }
    } catch (error) {
      logError(`startTask for "${name}"`, error);
    }
  };

  return cron.schedule(cronPattern, taskFunction, {
    scheduled: true,
    timezone: TIMEZONE
  });
};

/**
 * Schedules the end of a recording task
 */
const scheduleEndTask = (task, capturer, index) => {
  const { id, day, name, end_at } = task;

  const cronPattern = formatCronPattern(end_at, day);

  const taskFunction = async () => {
    try {
      // Check if task is still valid
      const { data, error } = await supabase
        .from('records')
        .select('id')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.log(`Task ${id} no longer exists, skipping execution`);
        return;
      }

      const nameOfFile = `${name}-${Date.now()}-${index}`;
      await controlCapture('stop', {
        nameOfVideo: nameOfFile
      }, capturer);

      const result = await updateCapturerStatus(capturer, false);

      if (result.success) {
        await renameFile(capturer, nameOfFile);
        console.log(`Ending task "${name}" on ${day} at ${end_at}`);
      }
    } catch (error) {
      logError(`endTask for "${name}"`, error);
    }
  };

  return cron.schedule(cronPattern, taskFunction, {
    scheduled: true,
    timezone: TIMEZONE
  });
};

const parseTime = (timeStr) => {
  const parts = timeStr.split(':').map(Number);
  return {
    hours: parts[0],
    minutes: parts[1] || 0,
    seconds: parts[2] || 0
  };
};

const convertSecondsToTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

const calculateChunks = (startTimeStr, endTimeStr, chunkDuration) => {
  const start = parseTime(startTimeStr);
  const end = parseTime(endTimeStr);

  let startSeconds = start.hours * 3600 + start.minutes * 60 + start.seconds;
  const endSeconds = end.hours * 3600 + end.minutes * 60 + end.seconds;

  if (endSeconds <= startSeconds) return [];

  const chunkDurationSeconds = chunkDuration * 60;
  const chunks = [];
  let currentStart = startSeconds;

  while (currentStart < endSeconds) {
    let currentEnd = currentStart + chunkDurationSeconds;
    if (currentEnd > endSeconds) currentEnd = endSeconds;

    chunks.push({
      startTime: convertSecondsToTime(currentStart),
      endTime: convertSecondsToTime(currentEnd),
    });

    currentStart = currentEnd + 1; // Espacio de 1 segundo entre chunks
  }

  return chunks;
};

const scheduleChunkStart = (task, capturer, startTime, day, chunkIndex) => {
  const cronPattern = formatCronPattern(startTime, day);
  const { id, name } = task;

  const taskFunction = async () => {
    try {
      // Check if task is still valid
      const { data, error } = await supabase
        .from('records')
        .select('id')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.log(`Task ${id} no longer exists, skipping chunk execution`);
        return;
      }

      await controlCapture('start', {}, capturer);
      await updateCapturerStatus(capturer, true, id);
      console.log(`Inicio chunk ${chunkIndex + 1} de "${name}" a las ${startTime}`);
    } catch (error) {
      logError(`scheduleChunkStart ${name}`, error);
    }
  };

  return cron.schedule(cronPattern, taskFunction, { timezone: TIMEZONE });
};

const scheduleChunkEnd = (task, capturer, endTime, day, chunkIndex) => {
  const cronPattern = formatCronPattern(endTime, day);
  const { id, name } = task;

  const taskFunction = async () => {
    try {
      // Check if task is still valid
      const { data, error } = await supabase
        .from('records')
        .select('id')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.log(`Task ${id} no longer exists, skipping chunk execution`);
        return;
      }

      const nameOfFile = `${name}-segmento${chunkIndex + 1}-${Date.now()}`;
      await controlCapture('stop', {
        nameOfVideo: nameOfFile
      }, capturer);
      await updateCapturerStatus(capturer, false);

      await renameFile(capturer, nameOfFile);
      console.log(`Fin chunk ${chunkIndex + 1} de "${name}" a las ${endTime}`);
    } catch (error) {
      logError(`scheduleChunkEnd ${name}`, error);
    }
  };

  return cron.schedule(cronPattern, taskFunction, { timezone: TIMEZONE });
};

/**
 * Register a task with its schedules in the registry
 */
const registerTask = (taskId, schedules) => {
  // If task already exists in registry, clean up first
  if (taskRegistry.has(taskId)) {
    const existingSchedules = taskRegistry.get(taskId);
    existingSchedules.forEach(schedule => schedule.stop());
  }

  // Store new schedules
  taskRegistry.set(taskId, schedules);
};

/**
 * Remove a task from the registry and stop its schedules
 */
const unregisterTask = (taskId) => {
  if (taskRegistry.has(taskId)) {
    const schedules = taskRegistry.get(taskId);
    schedules.forEach(schedule => schedule.stop());
    taskRegistry.delete(taskId);
    return true;
  }
  return false;
};

/**
 * Check if a task has been cancelled
 */
const isTaskCancelled = (taskId) => {
  return !taskRegistry.has(taskId);
};

/**
 * Schedule a single task
 */
const scheduleTask = async (taskId) => {
  try {
    const { data: task, error } = await supabase
      .from('records')
      .select('*, capturers(*)')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      throw new Error(`Task ${taskId} not found or error: ${error?.message}`);
    }

    // Unregister existing task if it exists
    unregisterTask(taskId);

    const capturer = task.capturers;
    if (!capturer) return false;

    const schedules = [];

    if (task.chunk_time > 0) {
      const chunks = calculateChunks(task.start_at, task.end_at, task.chunk_time);
      chunks.forEach((chunk, chunkIndex) => {
        const startSchedule = scheduleChunkStart(task, capturer, chunk.startTime, task.day, chunkIndex);
        const endSchedule = scheduleChunkEnd(task, capturer, chunk.endTime, task.day, chunkIndex);
        schedules.push(startSchedule, endSchedule);
      });
    } else {
      const startSchedule = scheduleStartTask(task, capturer);
      const endSchedule = scheduleEndTask(task, capturer, 0);
      schedules.push(startSchedule, endSchedule);
    }

    registerTask(taskId, schedules);
    return true;
  } catch (error) {
    logError(`scheduleTask for ${taskId}`, error);
    return false;
  }
};

/**
 * Main controller function to start all schedules
 */
const startSchedules = async (req, res) => {
  try {
    // Get all current schedules and stop them
    taskRegistry.forEach((schedules, taskId) => {
      schedules.forEach(schedule => schedule.stop());
    });
    taskRegistry.clear();

    const { data, error, status } = await supabase
      .from('records')
      .select('*, capturers(*)');

    if (status !== 200) {
      return res.status(status).json({ message: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({ message: 'No records to schedule' });
    }

    // Schedule each task
    let scheduledCount = 0;
    for (const task of data) {
      const capturer = task.capturers;
      if (!capturer) continue;

      const schedules = [];

      if (task.chunk_time > 0) {
        const chunks = calculateChunks(task.start_at, task.end_at, task.chunk_time);
        chunks.forEach((chunk, chunkIndex) => {
          const startSchedule = scheduleChunkStart(task, capturer, chunk.startTime, task.day, chunkIndex);
          const endSchedule = scheduleChunkEnd(task, capturer, chunk.endTime, task.day, chunkIndex);
          schedules.push(startSchedule, endSchedule);
        });
      } else {
        const startSchedule = scheduleStartTask(task, capturer);
        const endSchedule = scheduleEndTask(task, capturer, 0);
        schedules.push(startSchedule, endSchedule);
      }

      registerTask(task.id, schedules);
      scheduledCount++;
    }

    return res.status(200).json({
      message: `Successfully scheduled ${scheduledCount} tasks`,
      data
    });

  } catch (error) {
    logError('startSchedules', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new task and schedule it
 */
const createTask = async (req, res) => {
  try {
    const { data } = req.body;

    // Schedule the new task
    let scheduled = false
    for (const task of data) {
      scheduled = await scheduleTask(task.id);
    }

    return res.status(201).json({
      message: scheduled ? 'Task created and scheduled successfully' : 'Task created but scheduling failed',
      data,
    });
  } catch (error) {
    logError('createTask', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing task and reschedule it
 */
const updateTask = async (req, res) => {
  try {
    const { oldData, newData } = req.body;

    // Unschedule old task and schedule updated one
    let scheduled = false

    for (const oldTask of oldData) {
      unregisterTask(oldTask.id);
    }

    for (const task of newData) {
      scheduled = await scheduleTask(task.id);
    }
    console.log(scheduled)
    return res.status(200).json({
      message: scheduled ? 'Task updated and rescheduled successfully' : 'Task updated but rescheduling failed',
      data: newData
    });
  } catch (error) {
    logError('updateTask', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a task and remove its schedules
 */
const deleteTask = async (req, res) => {
  try {
    const { data } = req.body;
    // Unschedule the task
    let unscheduled = false
    for (const task of data) {
      unscheduled = unregisterTask(task.id);
    }

    return res.status(200).json({
      message: unscheduled ? 'Task deleted and unscheduled successfully' : 'Task deleted but was not scheduled',
    });
  } catch (error) {
    logError('deleteTask', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Stop a specific task
 */
const stopTask = async (req, res) => {
  const { capturerName } = req.body;

  try {
    // Obtener capturer desde Supabase
    const { data: capturer, error } = await supabase
      .from('capturers')
      .select('*')
      .eq('name', capturerName)
      .single();

    if (error) throw error;

    // Get the active record ID
    const recordId = capturer.record_active_id;

    // Stop the current recording
    await controlCapture('stop', {}, capturer);

    // Update capturer status
    await updateCapturerStatus(capturer, false, null);

    res.status(200).json({ message: 'Tarea detenida exitosamente' });
  } catch (error) {
    logError('stopTask', error);
    res.status(500).json({ message: 'Error al detener la tarea' });
  }
};

/**
 * Stop all tasks for a specific capturer
 */
const stopSchedules = async (req, res) => {
  const { capturerName } = req.body;

  try {
    // Obtener capturer desde Supabase
    const { data: capturer, error } = await supabase
      .from('capturers')
      .select('*')
      .eq('name', capturerName)
      .single();

    if (error) throw error;

    // Obtener el ID de la grabación activa
    const activeRecordId = capturer.record_active_id;

    // Detener la grabación actual
    try {
      await controlCapture('stop', {}, capturer);
      console.log(`Grabación detenida para el capturer ${capturerName}`);
    } catch (stopError) {
      // Si hay error 400, significa que no había grabación en curso
      if (stopError.response && stopError.response.status === 400) {
        console.log(`No hay grabación activa para detener en el capturer ${capturerName}`);
      } else {
        throw stopError;
      }
    }

    // Actualizar estado del capturer
    await updateCapturerStatus(capturer, false, null);

    // Si hay una grabación activa, cancelar sus chunks futuros
    if (activeRecordId) {
      // Obtener todas las programaciones asociadas a esta tarea
      const taskSchedules = [];

      // Buscar y obtener solo las programaciones de la tarea activa
      taskRegistry.forEach((schedules, taskId) => {
        if (taskId === activeRecordId) {
          // Detener todas las programaciones de esta tarea específica
          schedules.forEach(schedule => schedule.stop());
          taskSchedules.push(...schedules);

          // Volver a programar la tarea para futuras ejecuciones
          // pero empezando desde la próxima vez según su programación cron
          scheduleTask(activeRecordId);

          console.log(`Chunks futuros inmediatos cancelados para la tarea ${activeRecordId}`);
        }
      });
    }

    res.status(200).json({
      message: 'Grabación actual detenida exitosamente. Las demás tareas programadas continuarán normalmente.',
      capturer: capturerName
    });
  } catch (error) {
    logError('stopSchedules', error);
    res.status(500).json({
      message: 'Error al detener la grabación',
      error: error.message
    });
  }
};

export {
  startSchedules,
  stopSchedules,
  createTask,
  updateTask,
  deleteTask,
  scheduleTask,
  unregisterTask
};