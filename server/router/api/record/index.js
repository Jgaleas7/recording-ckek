import express from 'express'
const router = express.Router()

import { startRecord, stopRecord, renameVideo, clearCapturer } from '../../../controllers/records-controller.js'

router.post('/record', startRecord)
router.post('/stop', stopRecord)
router.post('/rename-video', renameVideo)
router.post('/clear', clearCapturer)

export default router
