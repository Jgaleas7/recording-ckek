import express from 'express'
const router = express.Router()

import { startSchedules, stopSchedules, createTask, updateTask, deleteTask } from '../../../controllers/schedule-controller.js'

router.get('/', startSchedules)
router.post('/stop', stopSchedules)
router.post('/create', createTask)
router.post('/update', updateTask)
router.post('/delete', deleteTask)

export default router
