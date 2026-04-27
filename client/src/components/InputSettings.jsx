import { useState } from 'react'
import { Button, FormControl, InputLabel, MenuItem, Select, Typography, Box } from '@mui/material'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { CAPTURER_NAMES } from '../const'
import recordApi from '../api/recordApi'
import Toast from '../utils/Toast'

const InputSettings = ({ capturer, format, handleChangeCapturer, handleChangeFormat }) => {
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    const ok = window.confirm(
      `Reset ${capturer}? This stops any active recording and saves it with a recovery name.`
    )
    if (!ok) return
    setResetting(true)
    try {
      const res = await recordApi.post('/recordings/clear', { capturer })
      Toast({ type: 'success', message: res?.data?.data ?? `${capturer} cleared.` })
    } catch (error) {
      Toast({ type: 'error', message: `Failed to clear ${capturer}: ${error?.message ?? 'unknown'}` })
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Select the entry
      </Typography>
      <FormControl fullWidth size='small' margin='dense'>
        <InputLabel id='select-capturer'>Capturer</InputLabel>
        <Select labelId='select-capturer' id='capturer' defaultValue={1} value={capturer} label='Capturer' onChange={handleChangeCapturer}>
          {CAPTURER_NAMES.map((name, idx) => (
            <MenuItem key={name} value={name}>{`Capturer ${idx + 1}`}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size='small' margin='dense'>
        <InputLabel id='select-format'>Format</InputLabel>
        <Select labelId='select-format' id='format' value={format} label='Format' onChange={handleChangeFormat}>
          <MenuItem value='mp4'>MP4</MenuItem>
          <MenuItem value='mxf'>MXF</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ mt: 2 }}>
        <Button
          fullWidth
          variant='outlined'
          color='warning'
          size='small'
          startIcon={<RestartAltIcon />}
          disabled={resetting}
          onClick={handleReset}
        >
          {resetting ? 'Resetting…' : 'Reset capturer'}
        </Button>
      </Box>
    </>
  )
}

export default InputSettings
