// src/routes/recording.routes.js
import { Router } from 'express';
import { startSchedules, createTask, updateTask, deleteTask } from '../controllers/recording.controller.js';

const router = Router();

router.post('/start', startSchedules);
router.post('/create', createTask);
router.put('/update', updateTask);
router.delete('/delete', deleteTask);

export default router;

