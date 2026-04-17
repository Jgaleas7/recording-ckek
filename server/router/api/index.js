import express from 'express'
const router = express.Router()

import recordsRouter from './record/index.js'
import schedulesRouter from './schedule/index.js'

router.use('/recordings', recordsRouter)
router.use('/schedules', schedulesRouter)

export default router
