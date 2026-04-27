import { Stack, TextField, Button, FormHelperText } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { ToastContainer } from 'react-toastify'
import * as yup from 'yup'
import CustomDialog from './mui/Dialog'
import Toast from '../utils/Toast'
import useRecordStore from '../store/recorderStore'
import renameApi from '../api/renameApi'
import { InputLabel, MenuItem, Select, Typography } from '@mui/material'

const schema = yup.object().shape({
  name: yup.string().required('El nombre es obligatorio'),
  destination: yup.string().required('El destino es obligatorio').oneOf(['mcr', 'clic'])
})

const DialogToSaveRecord = ({ open, handleCloseDialog }) => {
  const capturer = useRecordStore((state) => state.capturer)
  const format = useRecordStore((state) => state.format)
  const nameOfVideoToSave = useRecordStore((state) => state.nameOfVideoToSave)
  const updateNameOfVideoToSave = useRecordStore((state) => state.updateNameOfVideoToSave)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    // try {
    //   const { name , destination} = data
    //   const basePath = destination === 'clic' ? '\\\\192.168.100.230\\d\\GENTEBDH\\' : ''
    //   const newName = name === '' ? nameOfVideoToSave[capturer] : name

    //   // const res = await renameApi.post(`/${capturer}`, {
    //   //   FileName: `${nameOfVideoToSave[capturer]}.mp4`,
    //   //   NewFileName: `${newName}.mp4`
    //   // })
    //   const res = await renameApi.post(`/${capturer}`, {
    //     FileName: `${nameOfVideoToSave[capturer]}.mp4`,
    //     NewFileName: newName//fullFileName
    //   })
    //   if (res.status !== 200) throw new Error('Error al renombrar la grabación')

    //   updateNameOfVideoToSave(capturer, '')

    //   Toast({ message: 'El nombre de la grabación se guardo con éxito', type: 'success' })
    //   reset({ name: '' })
    //   handleCloseDialog()
    // } catch (error) {
    //   Toast({ message: 'Error al renombrar las grabaciones', type: 'error' })
    //   reset({ name: '', destination: '' })
    //   updateNameOfVideoToSave(capturer, '')
    //   handleCloseDialog()
    //   console.log(error)
    // }

    try {
      const { name, destination } = data
      const basePath = 'C:\\recordings\\'
      const ext = format === 'mxf' ? 'mxf' : 'mp4'

      const newName = name === '' ? nameOfVideoToSave[capturer] : name
      const fullFileName = `${basePath}${newName}.${ext}`

      const res = await renameApi.post('', {
        FileName: `${nameOfVideoToSave[capturer]}.${ext}`,
        NewFileName: fullFileName
      })

      if (res.status !== 200) throw new Error('Error renaming the recording')

      updateNameOfVideoToSave(capturer, '')
      Toast({ message: 'The recording name was saved successfully', type: 'success' })
      reset({ name: '', destination: '' })
      handleCloseDialog()
    } catch (error) {
      Toast({ message: 'Error renaming the recording', type: 'error' })
      reset({ name: '', destination: '' })
      updateNameOfVideoToSave(capturer, '')
      handleCloseDialog()
      console.log(error)
    }



  }

  const handleClose = async () => {

    try {
      const name = `Autorec-${Date.now()}`
      const ext = format === 'mxf' ? 'mxf' : 'mp4'

      const res = await renameApi.post('', {
        FileName: `${nameOfVideoToSave[capturer]}.${ext}`,
        NewFileName: `C:\\recordings\\${name}.${ext}`
      })

      if (res.status !== 200) throw new Error('Error renaming the recording')

      updateNameOfVideoToSave(capturer, '')
      reset({ name: '' })
      handleCloseDialog()
    } catch (error) {
      console.log(error)
      updateNameOfVideoToSave(capturer, '')
      reset({ name: '' })
      handleCloseDialog()
    }
  }


  // return (

  //   <CustomDialog title={'Destino y nombre de la grabación'} open={open} handleClose={handleCloseDialog}>

  //     <h2>Selecciona el destino</h2>


  //       <Select justifyContent='flex-end' >
  //         <MenuItem value={'mcr'}>MCR</MenuItem>
  //         <MenuItem value={'clic'}>Clic</MenuItem>
  //       </Select>

  //     <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>

  //       <TextField
  //         id='outlined-required'
  //         size='small'
  //         variant='outlined'
  //         fullWidth
  //         label='Nombre de la grabación'
  //         error={Boolean(errors?.name?.message)}
  //         helperText={errors?.name?.message}
  //         {...register('name')}


  //       />
  //       <Stack direction='row' justifyContent='flex-end' spacing={2} my={2}>
  //         <Button type='submit' variant='contained' color='primary'>
  //           Guardar
  //         </Button>
  //         <Button variant='outlined' color='primary' onClick={handleClose}>
  //           Cancelar
  //         </Button>
  //       </Stack>
  //     </form>
  //     <ToastContainer />
  //   </CustomDialog>
  // )


  //modified

  return (
    <CustomDialog title={'Destination and name of the recording'} open={open} handleClose={handleCloseDialog}>
      <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
        <h2>Select destination</h2>

        <Controller
          name="destination"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <>
              <Select
                {...field}
                error={Boolean(errors.destination)}
                displayEmpty
                fullWidth
                size="small"
              >
                <MenuItem value="" disabled>
                  Select destination
                </MenuItem>
                <MenuItem value="mcr">MCR</MenuItem>
                <MenuItem selected value="clic">Clic</MenuItem>
              </Select>
              {errors.destination && (
                <FormHelperText error>
                  {errors.destination.message}
                </FormHelperText>
              )}
            </>
          )}
        />

        <TextField
          id='outlined-required'
          size='small'
          variant='outlined'
          fullWidth
          label='Name of the recording'
          error={Boolean(errors?.name)}
          helperText={errors?.name?.message}
          {...register('name')}
          sx={{ mt: 2 }}
        />

        <Stack direction='row' justifyContent='flex-end' spacing={2} my={2}>
          <Button type='submit' variant='contained' color='primary'>
            Save
          </Button>
          <Button variant='outlined' color='primary' onClick={handleClose}>
            Cancel
          </Button>
        </Stack>
      </form>
      <ToastContainer />
    </CustomDialog>
  )

}

export default DialogToSaveRecord
