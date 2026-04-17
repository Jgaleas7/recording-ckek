import { FormControl, InputLabel, MenuItem, Select, Typography, Box } from '@mui/material'

const InputSettings = ({ capturer, format, handleChangeCapturer, handleChangeFormat }) => {
  return (
    <>
      {/* <Box sx={{ mt: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Typography variant='subtitle1' sx={{ mb: 1 }}>
          Vista previa de transmisión:
        </Typography>
        <iframe
          src="https://192.168.11.244/rec/?view=kU4MZhE"
          title="Transmisión en vivo"
          width="100%"
          height="300"
          style={{ border: 'none', borderRadius: '8px' }}
          allow="autoplay; fullscreen; microphone; camera"
        />
      </Box> */}


      <Typography variant='h6' sx={{ mb: 2 }}>
        Select the entry
      </Typography>
      <FormControl fullWidth size='small' margin='dense'>
        <InputLabel id='select-capturer'>Capturer</InputLabel>
        <Select labelId='select-capturer' id='capturer' defaultValue={1} value={capturer} label='Capturer' onChange={handleChangeCapturer}>
          <MenuItem value={'capturer1'}>Capturer 1</MenuItem>
          <MenuItem value={'capturer2'}>Capturer 2</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth size='small' margin='dense'>
        <InputLabel id='select-format'>Format</InputLabel>
        <Select labelId='select-format' id='format' value={format} label='Format' onChange={handleChangeFormat}>
          <MenuItem value='mp4'>MP4</MenuItem>
        </Select>
      </FormControl>

    </>
  )
}

export default InputSettings
