// src/services/recording.service.js
export const calculateChunks = (startTimeStr, endTimeStr, chunkDuration) => {
  const start = parseTime(startTimeStr);
  const end = parseTime(endTimeStr);
  
  let currentStart = start.hours * 3600 + start.minutes * 60;
  const endSeconds = end.hours * 3600 + end.minutes * 60;
  const chunkSeconds = chunkDuration * 60;

  const chunks = [];
  while (currentStart < endSeconds) {
    const currentEnd = Math.min(currentStart + chunkSeconds, endSeconds);
    chunks.push({
      startTime: convertSecondsToTime(currentStart),
      endTime: convertSecondsToTime(currentEnd)
    });
    currentStart = currentEnd;
  }
  return chunks;
};