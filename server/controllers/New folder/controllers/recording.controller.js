
// src/controllers/recording.controller.js
import { recordingQueue, chunkQueue } from '../queues/recording.queue.js';
import { supabase } from '../db.js';

export const startSchedules = async (req, res) => {
  try {
    const { data: tasks } = await supabase
      .from('records')
      .select('*, capturers(*)');

    tasks.forEach(async (task) => {
      if (task.chunk_time > 0) {
        await scheduleChunkedTask(task);
      } else {
        await scheduleNormalTask(task);
      }
    });

    res.status(200).json({ message: 'Tareas programadas correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const scheduleNormalTask = async (task) => {
  const startTime = parseTime(task.start_at);
  const startDelay = calculateDelay(task.start_at);

  await recordingQueue.add('startRecording', {
    taskId: task.id,
    capturer: task.capturers
  }, { delay: startDelay });
};

const scheduleChunkedTask = async (task) => {
  const chunks = calculateChunks(task.start_at, task.end_at, task.chunk_time);
  
  chunks.forEach(async (chunk, index) => {
    await chunkQueue.add('startChunk', {
      taskId: task.id,
      chunkIndex: index,
      capturer: task.capturers
    }, { delay: calculateChunkDelay(task, index) });
  });
};