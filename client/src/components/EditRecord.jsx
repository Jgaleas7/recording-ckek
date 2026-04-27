import { useEffect, useState } from 'react'
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
import { MobileTimePicker } from '@mui/x-date-pickers'
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
  name: yup.string().required('The name is required'),
  capturer: yup.string().required('The capturer is required'),
  format: yup.string().oneOf(['mp4', 'mxf']).required('The format is required'),
  days: yup.array().of(yup.string()).min(1, 'Select at least 1 day of recording'),
})

const EditRecord = ({ open, handleCloseDialog, selectedRow }) => {
  const addRecords = useRecordStore((state) => state.addRecords)
  const filteredRecords = useRecordStore((state) => state.filteredRecords)
  const filterRecordsByCapturer = useRecordStore((state) => state.filterRecordsByCapturer)
  const deleteRecord = useRecordStore((state) => state.deleteRecord)
  const [checkedChunk, setCheckedChunk] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    const date = new Date(),
      year = date.getFullYear(),
      month = date.getMonth(),
      day = date.getDate(),
      fields = ['name', 'capturer', 'format', 'days', 'startAt', 'endAt', 'chunkTime']

    if (selectedRow.length > 0) {
      fields.forEach((field) => {
        if (field == 'startAt' || field == 'endAt') {
          setValue(field, dayjs(`${year}-${month}-${day} ${selectedRow[0][field]}`))
        } else {
          setValue(field, selectedRow[0][field])
        }
      })
    }
  }, [selectedRow])

  const onSubmit = async (data) => {
    try {
      const startRecordAt = dayjs(data?.startAt)
      const endRecordAt = dayjs(data?.endAt)
      const chunkTime = data?.chunkTime
      const selectedCapturer = `capturer${Number(data?.capturer)}`

      //1. Borrar los registros de la tabla records
      const { data: recordsDelete, error: errorToDelete, status } = await supabase.from('records').delete().eq('name', data?.name).select()

      if (errorToDelete) throw errorToDelete

      if (status == 200) {
        const rowsToDelete = filteredRecords.filter((row) => row?.name == data?.name)
        rowsToDelete.forEach((row) => {
          deleteRecord(row.id)
        })
        const recordsToInsertDB = data?.days?.map((day) => {
          return {
            name: data?.name,
            day,
            start_at: startRecordAt.format('HH:mm:ss'),
            end_at: endRecordAt.format('HH:mm:ss'),
            capturer_id: Number(data?.capturer),
            format: data?.format,
            chunk_time: chunkTime !== '00:00' ? data?.chunkTime : null
          }
        })

        const { error, data: responseData } = await supabase.from('records').insert(recordsToInsertDB).select('*, capturers(name)')
        if (error) throw error

        const res = await recordApi.post('/schedules/update', { newData: responseData, oldData: recordsDelete })

        if (res.status !== 200) {
          throw new Error('Error updating the schedule')
        }

        addRecords(responseData)
        filterRecordsByCapturer(selectedCapturer)
        Toast({ type: 'success', message: 'The recording was updated successfully' })
      }
      /* reset({ name: '', capturer: '', days: [] }) */
    } catch (error) {
      Toast({ type: 'error', message: 'Error updating the recording' })
      console.log(error)
    }
  }

  return (
    <CustomDialog title={'Editar grabación'} open={open} handleClose={handleCloseDialog}>
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
          <InputLabel id='select-capturer'>Select the capturer</InputLabel>
          <Controller
            name='capturer'
            defaultValue=''
            control={control}
            render={({ field }) => (
              <Select {...field} labelId='select-capturer' label='Select the capturer'>
                <MenuItem value={1}>Capturer 1</MenuItem>
                <MenuItem value={2}>Capturer 2</MenuItem>
                <MenuItem value={3}>Capturer 3</MenuItem>
                <MenuItem value={4}>Capturer 4</MenuItem>
              </Select>
            )}
          />
          {errors?.capturer && <FormHelperText>{errors?.capturer?.message}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }} size='small' error={Boolean(errors?.format?.message)}>
          <InputLabel id='select-format'>Select the format</InputLabel>
          <Controller
            name='format'
            defaultValue='mp4'
            control={control}
            render={({ field }) => (
              <Select {...field} labelId='select-format' label='Select the format'>
                <MenuItem value='mp4'>MP4</MenuItem>
                <MenuItem value='mxf'>MXF</MenuItem>
              </Select>
            )}
          />
          {errors?.format && <FormHelperText>{errors?.format?.message}</FormHelperText>}
        </FormControl>

        <Stack direction='row' spacing={2} my={2} divider={<Divider orientation='vertical' flexItem />}>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={checkedChunk} onChange={(e) => setCheckedChunk(e.target.checked)} />}
              label='Usar chunking'
            />
          </FormGroup>

          <FormControl size='small' sx={{ width: 300 }} error={Boolean(errors?.chunkTime?.message)}>
            <InputLabel id='select-chunkTime'>Select the chunk time</InputLabel>
            <Controller
              name='chunkTime'
              defaultValue={'00:00'}
              control={control}
              render={({ field }) => (
                <Select {...field} labelId='select-chunkTime' label='Select the chunk time' disabled={!checkedChunk}>
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
          Select the start and end time:
        </Typography>
        <Stack direction='row' spacing={2} my={2} divider={<Divider orientation='vertical' flexItem />}>
          <Controller
            name='startAt'
            defaultValue={dayjs(new Date())}
            control={control}
            render={({ field }) => <MobileTimePicker {...field} ampm={false} label='Hora inicio' />}
          />
          <Controller
            name='endAt'
            defaultValue={dayjs(new Date())}
            control={control}
            render={({ field }) => <MobileTimePicker {...field} ampm={false} label='Hora final' />}
          />
        </Stack>
        <Stack direction='row' justifyContent='flex-end' spacing={2}>
          <Button type='submit' variant='contained' color='primary'>
            Update
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

export default EditRecord
