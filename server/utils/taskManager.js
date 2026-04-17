const activeTasks = new Map();

export const registerTask = (taskId, schedules) => {
  activeTasks.set(taskId, {
    schedules,
    isCancelled: false
  });
};

export const cancelTask = (taskId) => {
  if (activeTasks.has(taskId)) {
    const task = activeTasks.get(taskId);
    task.isCancelled = true;
    
    // Detener todos los schedules asociados
    task.schedules.forEach(schedule => schedule.stop());
    activeTasks.delete(taskId);
  }
};

export const isTaskCancelled = (taskId) => {
  return activeTasks.get(taskId)?.isCancelled || false;
};

console.log(activeTasks)