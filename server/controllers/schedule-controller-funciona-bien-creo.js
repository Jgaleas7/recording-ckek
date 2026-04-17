import cron from 'node-cron';
import { supabase } from '../db.js';
import axios from 'axios';
import { cancelTask, registerTask, isTaskCancelled } from '../utils/taskManager.js';
/**
 * Constants and configurations
 */
const CAPTURE_API_URL = `http://localhost`;
const RENAME_API_URL = 'http://localhost:5000/api/files/rename'
const TIMEZONE = 'America/Tegucigalpa';

/**
 * Helper functions to keep code DRY and maintainable
 */
const formatCronPattern = (time, day) => {
  const [hour, minute, second = '0'] = time.split(':');
  return `${second} ${minute} ${hour} * * ${day}`;
};

const logError = (context, error) => {
  console.error(`Error in ${context}:`, error?.message || error);
};

const updateCapturerStatus = async (capturer, isActive, recordId = null) => {
  try {
    const { status, error } = await supabase
      .from('capturers')
      .update({
        is_active: isActive,
        is_automatic: isActive,
        record_active_id: recordId
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
    })

    if(res.status !== 200 ) throw new Error(error?.message || 'Unknown error renaming file');

    return { success: true };
  } catch (error) {
    logError('renameFileStatus', error);
    return { success: false, error };
  }
}

const controlCapture = async (action, params = {}, capturer) => {
  try {
    const portCapturer = capturer?.name === "capturer1" ? 18080 : 19081
    if (action === 'start') {
      try {
        // Intentar detener cualquier captura en curso
        await axios.post(`${CAPTURE_API_URL}:${portCapturer}/stop-capture`);
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
      return await axios.get(`${CAPTURE_API_URL}:${portCapturer}/start-capture`);
    } else if (action === 'stop') {
      try {
        return await axios.post(`${CAPTURE_API_URL}:${portCapturer}/stop-capture`, params);
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
  const { day, name, end_at } = task;

  const cronPattern = formatCronPattern(end_at, day);

  const taskFunction = async () => {
    try {
      const nameOfFile = `${name}-${Date.now()}-${index}`
      await controlCapture('stop', {
        nameOfVideo: nameOfFile
      }, capturer);

      const result = await updateCapturerStatus(capturer, false);

      if (result.success) {
        await renameFile(capturer, nameOfFile)
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

  const taskFunction = async () => {
    if (isTaskCancelled(task.id)) {
      console.log(`Chunk ${chunkIndex} de "${task.name}" cancelado manualmente`);
      return;
    }
    try {
      await controlCapture('start', {}, capturer);
      await updateCapturerStatus(capturer, true, task.id);
      console.log(`Inicio chunk ${chunkIndex + 1} de "${task.name}" a las ${startTime}`);
    } catch (error) {
      logError(`scheduleChunkStart ${task.name}`, error);
    }
  };

  return cron.schedule(cronPattern, taskFunction, { timezone: TIMEZONE });
};

const scheduleChunkEnd = (task, capturer, endTime, day, chunkIndex) => {
  const cronPattern = formatCronPattern(endTime, day);

  const taskFunction = async () => {
    try {
      const nameOfFile = `${task.name}-segmento${chunkIndex + 1}-${Date.now()}`
      await controlCapture('stop', {
        nameOfVideo: nameOfFile
      }, capturer);
      await updateCapturerStatus(capturer, false);

      await renameFile(capturer, nameOfFile)
      console.log(`Fin chunk ${chunkIndex + 1} de "${task.name}" a las ${endTime}`);
    } catch (error) {
      logError(`scheduleChunkEnd ${task.name}`, error);
    }
  };

  return cron.schedule(cronPattern, taskFunction, { timezone: TIMEZONE });
};



/**
 * Main controller function to start all schedules
 */
let activeSchedules = [];


const stopTask = async (capturer) => {
  try {
    // Detener la grabación actual
    await controlCapture('stop', {}, capturer);

    // Obtener el taskId activo desde Supabase
    const { data: capturerData, error } = await supabase
      .from('capturers')
      .select('record_active_id')
      .eq('name', capturer.name)
      .single();

    if (error) throw error;
    const taskId = capturerData.record_active_id;

    if (taskId) {
      // Cancelar todos los cron jobs asociados a este taskId
      activeSchedules = activeSchedules.filter(({ taskId: currentTaskId, cronJob }) => {
        if (currentTaskId === taskId) {
          cronJob.stop();
          return false; // Eliminar del array
        }
        return true;
      });

      // Actualizar estado del capturer
      await updateCapturerStatus(capturer, false, null);
    }

    return { success: true };
  } catch (error) {
    logError('stopTask', error);
    return { success: false, error };
  }
};

const startSchedules = async (req, res) => {
  try {

    activeSchedules.forEach(schedule => {
      schedule?.cronJob?.stop();
    });
    activeSchedules = [];

    const { data, error, status } = await supabase
      .from('records')
      .select('*, capturers(*)');

    if (status !== 200) {
      return res.status(status).json({ message: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({ message: 'No records to schedule' });
    }

    // Create an array to track all schedules (helpful for potential cleanup)

    data.forEach((task, index) => {
      const capturer = task.capturers;
      if (!capturer) return;

      const taskId = task.id
      if (task.chunk_time > 0) {
        const chunks = calculateChunks(task.start_at, task.end_at, task.chunk_time);
        chunks.forEach((chunk, chunkIndex) => {
          const startSchedule = scheduleChunkStart(task, capturer, chunk.startTime, task.day, chunkIndex);
          const endSchedule = scheduleChunkEnd(task, capturer, chunk.endTime, task.day, chunkIndex);
          activeSchedules.push({ taskId, cronJob: startSchedule }, { taskId, cronJob: endSchedule });
        });
      } else {
        const startSchedule = scheduleStartTask(task, capturer);
        const endSchedule = scheduleEndTask(task, capturer, index);
        activeSchedules.push({ taskId, cronJob: startSchedule }, { taskId, cronJob: endSchedule });
      }

      registerTask(task.id, activeSchedules)
      /* const capturer = task.capturers;
      
      if (!capturer) {
        console.warn(`Task "${task.name}" has no associated capturer, skipping`);
        return;
      }
      
      const startSchedule = scheduleStartTask(task, capturer);
      const endSchedule = scheduleEndTask(task, capturer, index);
      
      // Guardar referencias a los schedules
      activeSchedules.push(startSchedule, endSchedule); */
    });

    return res.status(200).json({
      message: `Successfully scheduled ${activeSchedules.length / 2} tasks`,
      data
    });

  } catch (error) {
    logError('startSchedules', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

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

    // Ejecutar lógica de detención
    const result = await stopTask(capturer);

    if (result.success) {
      res.status(200).json({ message: 'Tarea detenida exitosamente' });
    } else {
      throw result.error;
    }
  } catch (error) {
    logError('stopSchedules', error);
    res.status(500).json({ message: 'Error al detener la tarea' });
  }
};

export { startSchedules, stopSchedules };