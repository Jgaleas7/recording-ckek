import { useState } from 'react'
import {
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Button,
  FormHelperText,
} from '@mui/material'
import { MobileTimePicker, TimeField } from '@mui/x-date-pickers'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { ToastContainer } from 'react-toastify'
import * as yup from 'yup'
import dayjs from 'dayjs'

import { supabase } from '../config/supabase'
import { daysOptions } from '../utils'
import CustomDialog from './mui/Dialog'
import useRecordStore from '../store/recorderStore'
import Toast from '../utils/Toast'
import recordApi from '../api/recordApi'

const schema = yup.object().shape({
  name: yup.string().required('El nombre es obligatorio'),
  capturer: yup.string().required('El capturer es obligatorio'),
  chunkTime: yup.string(),
  days: yup.array().of(yup.string()).min(1, 'Selecciona al menos 1 día de grabación'),
  startAt: yup.date().required('La hora de inicio es obligatoria'),
  endAt: yup
    .date()
    .required('La hora de finalización es obligatoria')
    .min(yup.ref('startAt'), 'La hora de finalización debe ser mayor a la hora de inicio'),
})

const AddRecord = ({ open, handleCloseDialog }) => {
  const addRecords = useRecordStore((state) => state.addRecords)
  const filterRecordsByCapturerAndDay = useRecordStore((state) => state.filterRecordsByCapturerAndDay)
  const filterRecordsByCapturer = useRecordStore((state) => state.filterRecordsByCapturer)
  const capturer = useRecordStore((state) => state.capturer)
  const activeTabIndex = useRecordStore((state) => state.activeTabIndex)

  const [checkedChunk, setCheckedChunk] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      //Validated name and capturer
      const { data: validatedName, error: errorValidatedName } = await supabase
        .from('records')
        .select('name, capturer_id')
        .eq('name', data?.name)
        .eq('capturer_id', Number(data?.capturer))
      if (errorValidatedName) throw errorValidatedName

      if (validatedName.length > 0) {
        Toast({ message: `Ya existe una grabación con ese nombre para el capturer ${data?.capturer}`, type: 'info' })
        return
      }
      //Validated days, time and capturer
      const { data: validatedTime, error: errorValidatedTime } = await supabase
        .from('records')
        .select('capturer_id, start_at, end_at, day')
        .eq('capturer_id', Number(data?.capturer))
        .gte('end_at', dayjs(data?.startAt).format('HH:mm'))
        .lte('start_at', dayjs(data?.endAt).format('HH:mm'))
        .in('day', data?.days)

      if (errorValidatedTime) throw errorValidatedTime

      if (validatedTime?.length > 0) {
        Toast({ message: `Ya existe una grabación en ese horario para el capturer ${data?.capturer}`, type: 'info' })
        return
      }

      const startRecordAt = dayjs(data?.startAt)
      const endRecordAt = dayjs(data?.endAt)
      const selectedCapturer = `capturer${Number(data?.capturer)}`
      const recordsToInsertDB = data?.days?.map((day) => {
        return {
          name: data?.name,
          day,
          start_at: startRecordAt.format('HH:mm'),
          end_at: endRecordAt.format('HH:mm'),
          chunk_time: checkedChunk && data?.chunkTime !== '00:00' ? data?.chunkTime : null,
          capturer_id: Number(data?.capturer),
        }
      })

      const { error, data: responseData } = await supabase.from('records').insert(recordsToInsertDB).select('*, capturers(name)')
      if (error) throw error

      const res = await recordApi.post('/schedules/create', { data: responseData })

      if (res.status !== 201) {
        throw new Error('Fallo al momento de crear el schedule')
      }

      addRecords(responseData)
      if (activeTabIndex === 0 && selectedCapturer === capturer) {
        filterRecordsByCapturerAndDay(selectedCapturer)
      } else if (activeTabIndex === 1 && selectedCapturer === capturer) {
        filterRecordsByCapturer(selectedCapturer)
      }
      Toast({ message: 'La grabación se guardo con éxito', type: 'success' })
      setCheckedChunk(false)
      reset({ name: '', capturer: '', chunkTime: '00:00', days: [] })
    } catch (error) {
      Toast({ message: 'Error al guardar las grabaciones', type: 'error' })
      console.log(error)
    }
  }

  return (
    <CustomDialog title={'Create new recording'} open={open} handleClose={handleCloseDialog}>
      <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
        <TextField
          id='outlined-required'
          size='small'
          variant='outlined'
          fullWidth
          label='Name of the recording'
          error={Boolean(errors?.name?.message)}
          helperText={errors?.name?.message}
          {...register('name')}
        />
        <FormControl fullWidth sx={{ my: 2 }} size='small' error={Boolean(errors?.capturer?.message)}>
          <InputLabel id='select-capturer'>Choose capturer</InputLabel>
          <Controller
            name='capturer'
            defaultValue=''
            control={control}
            render={({ field }) => (
              <Select {...field} labelId='select-capturer' label='Choose capturer'>
                <MenuItem value={1}>Capturer 1</MenuItem>
                <MenuItem value={2}>Capturer 2</MenuItem>
                <MenuItem value={3}>Capturer 3</MenuItem>
                <MenuItem value={4}>Capturer 4</MenuItem>
              </Select>
            )}
          />
          {errors?.capturer && <FormHelperText>{errors?.capturer?.message}</FormHelperText>}
        </FormControl>

        <Stack direction='row' spacing={2} my={2} divider={<Divider orientation='vertical' flexItem />}>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={checkedChunk} onChange={(e) => setCheckedChunk(e.target.checked)} />}
              label='Use chunking'
            />
          </FormGroup>

          <FormControl size='small' sx={{ width: 300 }} error={Boolean(errors?.chunkTime?.message)}>
            <InputLabel id='select-chunkTime'>Choose chunk time</InputLabel>
            <Controller
              name='chunkTime'
              defaultValue={'00:00'}
              control={control}
              render={({ field }) => (
                <Select {...field} labelId='select-chunkTime' label='Choose chunk time' disabled={!checkedChunk}>
                  <MenuItem value={'00:00'}>00:00</MenuItem>
                  <MenuItem value={15}>00:15</MenuItem>
                  <MenuItem value={30}>00:30</MenuItem>
                  <MenuItem value={45}>00:45</MenuItem>
                  <MenuItem value={60}>00:60</MenuItem>
                </Select>
              )}
            />
            {errors?.chunkTime && <FormHelperText>{errors?.chunkTime?.message}</FormHelperText>}
          </FormControl>
        </Stack>

        <Typography variant='subtitle2' color='white'>
          Days:
        </Typography>
        <FormGroup
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Controller
            name='days'
            defaultValue={[]}
            control={control}
            render={({ field }) => (
              <>
                {daysOptions.map((day) => (
                  <FormControlLabel
                    sx={{ mx: 0 }}
                    key={day.value}
                    label={day.label}
                    labelPlacement='start'
                    control={
                      <Checkbox
                        value={day.value}
                        checked={field.value.some((existingValue) => existingValue === day.value)}
                        onChange={(event, checked) => {
                          if (checked) {
                            field.onChange([...field.value, event.target.value])
                          } else {
                            field.onChange(field.value.filter((value) => value !== event.target.value))
                          }
                        }}
                      />
                    }
                  />
                ))}
              </>
            )}
          />
        </FormGroup>
        {errors?.days && (
          <FormHelperText error={Boolean(errors?.days?.message)} sx={{ mb: 2 }}>
            {errors?.days?.message}
          </FormHelperText>
        )}
        <Typography variant='subtitle2' gutterBottom={true} color='white'>
          Choose start and end time:
        </Typography>
        <Stack direction='row' spacing={2} my={2} divider={<Divider orientation='vertical' flexItem />}>
          <Controller
            name='startAt'
            defaultValue={dayjs(new Date())}
            control={control}
            render={({ field }) => <MobileTimePicker {...field} ampm={false} label='Start time' />}
          />
          <Controller
            name='endAt'
            defaultValue={dayjs(new Date())}
            control={control}
            render={({ field }) => <MobileTimePicker {...field} ampm={false} label='End time' />}
          />
        </Stack>
        <FormHelperText error={Boolean(errors?.endAt?.message)} sx={{ mb: 2 }}>
          {errors?.endAt?.message}
        </FormHelperText>
        <Stack direction='row' justifyContent='flex-end' spacing={2}>
          <Button type='submit' variant='contained' color='primary'>
            Save
          </Button>
          <Button variant='outlined' color='primary' onClick={handleCloseDialog}>
            Cancel
          </Button>
        </Stack>
      </form>
      <ToastContainer />
    </CustomDialog>
  )
}

export default AddRecord
