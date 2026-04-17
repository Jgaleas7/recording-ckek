import { useState } from 'react'
import { Typography, Box, Button } from '@mui/material'
import { useStopwatch } from 'react-timer-hook'
import StopIcon from '@mui/icons-material/Stop'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

import { supabase } from '../config/supabase'
import { CAPTURER_NAMES } from '../const'
import recordApi from '../api/recordApi'
import useRecordStore from '../store/recorderStore'
import Timer from './timer/Timer'
import Toast from '../utils/Toast'
import DialogToSaveRecord from './DialogToSaveRecord'

const RecordingControls = () => {
  const capturer = useRecordStore((state) => state.capturer)
  const updateNameOfVideoToSave = useRecordStore((state) => state.updateNameOfVideoToSave)

  const [activeButtons, setActiveButtons] = useState(
    CAPTURER_NAMES.reduce((acc, name) => ({ ...acc, [name]: false }), {})
  )
  const [open, setOpen] = useState(false)

  const sw1 = useStopwatch({ autoStart: false })
  const sw2 = useStopwatch({ autoStart: false })
  const sw3 = useStopwatch({ autoStart: false })
  const sw4 = useStopwatch({ autoStart: false })

  const stopwatches = {
    capturer1: sw1,
    capturer2: sw2,
    capturer3: sw3,
    capturer4: sw4,
  }

  const sw = stopwatches[capturer]
  const isActive = activeButtons[capturer]

  const setActive = (name, value) => {
    setActiveButtons((prev) => ({ ...prev, [name]: value }))
  }

  const handleOpenDialog = () => {
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    updateNameOfVideoToSave(capturer, '')
  }

  const handleStartRecord = async () => {
    const tempVideoName = `Autorec-${Date.now()}`
    try {
      const { error, data } = await supabase.from('capturers').select('*').eq('name', capturer)
      if (error) throw error

      const { is_active, is_automatic } = data[0]

      if (is_active || is_automatic) {
        Toast({
          type: 'info',
          message: 'No se puede grabar porque ya hay una grabación en curso.',
        })
        return
      }
    } catch (error) {
      console.log(error)
      Toast({
        type: 'error',
        message: `${error.message}`,
      })
    }
    try {
      setActive(capturer, true)
      updateNameOfVideoToSave(capturer, tempVideoName)

      const res = await recordApi.post('/recordings/record', {
        capturer,
        nameOfVideo: tempVideoName
      })

      if (res.status == 200) {
        sw.start()
        Toast({
          type: 'success',
          message: `${res.data.data}`,
        })
      }
    } catch (error) {
      setActive(capturer, false)
      console.log(error)
      if (error.status !== 200) {
        Toast({
          type: 'error',
          message: `${error.message}`,
        })
      }
    }
  }

  const handleStopRecord = async () => {
    try {
      const tempVideoName = `Autorec-${Date.now()}`
      sw.reset(undefined, false)
      setActive(capturer, false)

      const res = await recordApi.post('/recordings/stop', {
        capturer,
        nameOfVideo: tempVideoName,
      })

      if (res.status == 200) {
        handleOpenDialog()
        Toast({
          type: 'success',
          message: `${res.data.data}`,
        })
      }
    } catch (error) {
      console.log(error)
      if (error.status !== 200) {
        Toast({
          type: 'error',
          message: `${error.message}`,
        })
      }
    }
  }

  return (
    <>
      <Typography variant='h6' mb={2}>
        Recording
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6' mr={1}>
          Duration:{' '}
        </Typography>
        <Typography variant='h4'>
          <Timer seconds={sw.seconds} minutes={sw.minutes} hours={sw.hours} />
        </Typography>
      </Box>
      <Button
        variant='contained'
        color='error'
        size='large'
        startIcon={<FiberManualRecordIcon />}
        onClick={handleStartRecord}
        disabled={isActive}
        sx={{ mr: 2 }}
      >
        REC
      </Button>
      <Button variant='contained' size='large' startIcon={<StopIcon />} disabled={!isActive} onClick={handleStopRecord}>
        STOP
      </Button>
      <DialogToSaveRecord open={open} handleCloseDialog={handleCloseDialog} />
    </>
  )
}

export default RecordingControls
