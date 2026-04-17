import express from 'express'
const router = express.Router()

import { startRecord, stopRecord, renameVideo } from '../../../controllers/records-controller.js'

router.post('/record', startRecord)
router.post('/stop', stopRecord)
router.post('/rename-video', renameVideo)

export default router
