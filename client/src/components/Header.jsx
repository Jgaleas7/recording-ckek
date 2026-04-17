import { useState } from 'react'
import { AppBar, Box, Button, Toolbar, Tooltip, Typography } from '@mui/material'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import AddRecord from './AddRecord'
import recordApi from '../api/recordApi'
import useRecordStore from '../store/recorderStore'
import Toast from '../utils/Toast'
import ScreenRecorder from './ScreenShareRecorder';

const Header = ({ activeRecordRowId }) => {
  const capturer = useRecordStore((state) => state.capturer)

  const [open, setOpen] = useState(false)

  const handleOpenDialog = () => {
    setOpen(true)
  }
  const handleCloseDialog = () => {
    setOpen(false)
  }

  const handleStopAutomaticRecord = async () => {
    try {
      /*   const res = await recordApi.post('/recordings/stop', {
          capturer,
          nameOfVideo: `Autorec-${Date.now()}`,
          isStopAutomatic: true
        }) */
      const taskId = activeRecordRowId[capturer]
      const res = await recordApi.post('/schedules/stop', {
        capturerName: capturer,
      })

      if (res.status !== 200) return new Error('Error al detener la grabación automática')

      //await recordApi.get('/schedules')

      Toast({
        type: 'success',
        message: `${res.data.data}`,
      })
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


    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='static'>


        <Toolbar>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
            Chek Recorder
          </Typography>
          <Box display={'flex'} columnGap={1}>
            <Tooltip title='Add new record'>
              <Button color='success' variant='outlined' sx={{ paddingX: 1, minWidth: 30 }} onClick={handleOpenDialog}>
                <AddCircleIcon />
              </Button>
            </Tooltip>
            <Tooltip title='STOP Automatic Record'>
              <Button color='success' variant='outlined' sx={{ paddingX: 1, minWidth: 30 }} onClick={handleStopAutomaticRecord}>
                <StopCircleIcon />
              </Button>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <AddRecord open={open} handleCloseDialog={handleCloseDialog} />
      <div>

        {/* <ScreenRecorder /> */}
      </div>
    </Box>
  )
}

export default Header
/* 
Hay que mandar a reiniciar las tareas automaticas cuando le dan stop si no seguira grabando en especial si hay segmentos
*/