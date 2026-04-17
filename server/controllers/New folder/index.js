import { BullMQ } from 'bullmq';
import { supabase } from './db.js';
import { parseTime, convertSecondsToTime } from './utils/time.utils.js';
import { controlCapture, renameFile, updateCapturerStatus } from './services/recording.service.js';

const redisConfig = { connection: { host: 'localhost', port: 6379 } };

export const recordingQueue = new BullMQ('recordingQueue', redisConfig);
export const chunkQueue = new BullMQ('chunkQueue', redisConfig);

// Procesador de grabaciones normales
recordingQueue.process(async (job) => {
  const { taskId, capturer } = job.data;
  const { data: task } = await supabase
    .from('records')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task) throw new Error('Tarea no encontrada');

  try {
    await controlCapture('start', { nameOfVideo: task.name }, capturer);
    await updateCapturerStatus(capturer, true, taskId);

    // Programar fin de grabación
    await chunkQueue.add('stopRecording', {
      taskId,
      endTime: task.end_at,
      capturer
    }, { delay: calculateDelay(task.end_at) });

  } catch (error) {
    throw new Error(`Error iniciando grabación: ${error.message}`);
  }
});

// Procesador de chunks
chunkQueue.process(async (job) => {
  const { taskId, chunkIndex, capturer } = job.data;
  const { data: task } = await supabase
    .from('records')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task) throw new Error('Tarea no encontrada');

  try {
    const chunkName = `${task.name}_chunk_${chunkIndex + 1}`;
    
    if (job.name === 'startChunk') {
      await controlCapture('start', { nameOfVideo: chunkName }, capturer);
      await updateCapturerStatus(capturer, true, taskId);

      // Programar fin del chunk
      await chunkQueue.add('stopChunk', {
        taskId,
        chunkIndex,
        endTime: calculateChunkEndTime(task, chunkIndex),
        capturer
      }, { delay: calculateChunkDelay(task, chunkIndex) });

    } else if (job.name === 'stopChunk') {
      await controlCapture('stop', {}, capturer);
      await renameFile(capturer, chunkName);
      await updateCapturerStatus(capturer, false);

      // Programar siguiente chunk
      if (shouldContinueChunks(task, chunkIndex)) {
        await chunkQueue.add('startChunk', {
          taskId,
          chunkIndex: chunkIndex + 1,
          capturer
        }, { delay: 1000 }); // 1 segundo de espera entre chunks
      }
    }

  } catch (error) {
    throw new Error(`Error procesando chunk: ${error.message}`);
  }
});

