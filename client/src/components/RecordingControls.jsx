import { useState } from 'react'
import { Typography, Box, Button } from '@mui/material'
import { useStopwatch } from 'react-timer-hook'
import StopIcon from '@mui/icons-material/Stop'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

import { supabase } from '../config/supabase'
import { CAPTURERS } from '../const'
import recordApi from '../api/recordApi'
import useRecordStore from '../store/recorderStore'
import Timer from './timer/Timer'
import Toast from '../utils/Toast'
import DialogToSaveRecord from './DialogToSaveRecord'

const RecordingControls = () => {
  const capturer = useRecordStore((state) => state.capturer)
  const updateNameOfVideoToSave = useRecordStore((state) => state.updateNameOfVideoToSave)

  const [activeButtonCapturer1, setActiveButtonCapturer1] = useState(false)
  const [activeButtonCapturer2, setActiveButtonCapturer2] = useState(false)
  const [open, setOpen] = useState(false)

  const {
    seconds: secondsCapturer1,
    minutes: minutesCapturer1,
    hours: hoursCapturer1,
    start: startCapturer1,
    reset: resetCapturer1,
  } = useStopwatch({ autoStart: false })
  const {
    seconds: secondsCapturer2,
    minutes: minutesCapturer2,
    hours: hoursCapturer2,
    start: startCapturer2,
    reset: resetCapturer2,
  } = useStopwatch({ autoStart: false })

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

      if (capturer === CAPTURERS.capturer1) {
        setActiveButtonCapturer1(!activeButtonCapturer1)
        updateNameOfVideoToSave(capturer, tempVideoName)
      } else {
        setActiveButtonCapturer2(!activeButtonCapturer2)
        updateNameOfVideoToSave(capturer, tempVideoName)
      }

      const res = await recordApi.post('/recordings/record', {
        capturer,
        nameOfVideo: tempVideoName
      })

      if (res.status == 200) {
        if (capturer === CAPTURERS.capturer1) {
          startCapturer1()
        } else {
          startCapturer2()
          setActiveButtonCapturer2(!activeButtonCapturer2)
        }
        Toast({
          type: 'success',
          message: `${res.data.data}`,
        })
      }
    } catch (error) {
      setActiveButtonCapturer1(false)
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
      if (capturer === CAPTURERS.capturer1) {
        resetCapturer1(undefined, false)
        setActiveButtonCapturer1(!activeButtonCapturer1)
        /* updateNameOfVideoToSave(capturer, tempVideoName) */
      } else {
        resetCapturer2(undefined, false)
        setActiveButtonCapturer2(!activeButtonCapturer2)
        /* updateNameOfVideoToSave(capturer, tempVideoName) */
      }

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
        {capturer == CAPTURERS.capturer1 ? (
          <Typography variant='h4'>
            <Timer seconds={secondsCapturer1} minutes={minutesCapturer1} hours={hoursCapturer1} />
          </Typography>
        ) : (
          <Typography variant='h4'>
            <Timer seconds={secondsCapturer2} minutes={minutesCapturer2} hours={hoursCapturer2} />
          </Typography>
        )}
      </Box>
      {capturer == CAPTURERS.capturer1 ? (
        <>
          <Button
            variant='contained'
            color='error'
            size='large'
            startIcon={<FiberManualRecordIcon />}
            onClick={handleStartRecord}
            disabled={activeButtonCapturer1}
            sx={{ mr: 2 }}
          >
            REC
          </Button>
          <Button variant='contained' size='large' startIcon={<StopIcon />} disabled={!activeButtonCapturer1} onClick={handleStopRecord}>
            STOP
          </Button>
        </>
      ) : (
        <>
          <Button
            variant='contained'
            color='error'
            size='large'
            startIcon={<FiberManualRecordIcon />}
            onClick={handleStartRecord}
            disabled={activeButtonCapturer2}
            sx={{ mr: 2 }}
          >
            REC
          </Button>
          <Button variant='contained' size='large' startIcon={<StopIcon />} disabled={!activeButtonCapturer2} onClick={handleStopRecord}>
            STOP
          </Button>
        </>
      )}
      <DialogToSaveRecord open={open} handleCloseDialog={handleCloseDialog} />
    </>
  )
}

export default RecordingControls
