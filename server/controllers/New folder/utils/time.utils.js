// src/utils/time.utils.js
export const parseTime = (timeStr) => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return { hours, minutes, seconds };
  };
  
  export const convertSecondsToTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  