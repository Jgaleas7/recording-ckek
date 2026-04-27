import { useState } from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'

import { supabase } from '../config/supabase'
import { convertDataToRows } from '../utils'
import useRecordStore from '../store/recorderStore'
import EditRecord from './EditRecord'
import Toast from '../utils/Toast'
import recordApi from '../api/recordApi'

const TablePeriodic = () => {
  const [open, setOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState([])

  const filteredRecords = useRecordStore((state) => state.filteredRecords)
  const deleteRecord = useRecordStore((state) => state.deleteRecord)
  const rows = convertDataToRows(filteredRecords)

  const columns = [
    {
      field: 'startMonday',
      headerName: 'Start',
      flex: 1,
    },
    {
      field: 'endMonday',
      headerName: 'End',
      flex: 1,
    },
    {
      field: 'startTuesday',
      headerName: 'Start',
      flex: 1,
    },
    {
      field: 'endTuesday',
      headerName: 'End',
      flex: 1,
    },
    {
      field: 'startWednesday',
      headerName: 'Start',
      flex: 1,
    },
    {
      field: 'endWednesday',
      headerName: 'End',
      flex: 1,
    },
    {
      field: 'startThursday',
      headerName: 'Start',
      flex: 1,
    },
    {
      field: 'endThursday',
      headerName: 'End',
      flex: 1,
    },
    {
      field: 'startFriday',
      headerName: 'Start',
      flex: 1,
    },
    {
      field: 'endFriday',
      headerName: 'End',
      flex: 1,
    },
    {
      field: 'startSaturday',
      headerName: 'Start',
      flex: 1,
    },
    {
      field: 'endSaturday',
      headerName: 'End',
      flex: 1,
    },
    {
      field: 'startSunday',
      headerName: 'Start',
      flex: 1,
    },
    {
      field: 'endSunday',
      headerName: 'End',
      flex: 1,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      flex: 1,
      getActions: ({ id }) => {
        return [<GridActionsCellItem icon={<DeleteIcon />} label='Delete' onClick={() => handleDeleteRow(id)} color='inherit' />]
      },
    },
  ]

  const columnGroupingModel = [
    {
      groupId: 'Monday',
      children: [{ field: 'startMonday' }, { field: 'endMonday' }],
    },
    {
      groupId: 'Tuesday',
      children: [{ field: 'startTuesday' }, { field: 'endTuesday' }],
    },
    {
      groupId: 'Wednesday',
      children: [{ field: 'startWednesday' }, { field: 'endWednesday' }],
    },
    {
      groupId: 'Thursday',
      children: [{ field: 'startThursday' }, { field: 'endThursday' }],
    },
    {
      groupId: 'Friday',
      children: [{ field: 'startFriday' }, { field: 'endFriday' }],
    },
    {
      groupId: 'Saturday',
      children: [{ field: 'startSaturday' }, { field: 'endSaturday' }],
    },
    {
      groupId: 'Sunday',
      children: [{ field: 'startSunday' }, { field: 'endSunday' }],
    },
    {
      groupId: 'Actions',
      children: [{ field: 'actions' }],
    },
  ]

  const handleOpenDialog = () => {
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
  }

  const handleDeleteRow = async (name) => {
    try {


      const { data, error } = await supabase.from('records').delete().eq('name', name).select()

      if (error) throw error

      await recordApi.post('/schedules/delete', {
        data
      })

      const rowsToDelete = filteredRecords.filter((row) => row?.name == name)
      rowsToDelete.forEach((item) => {
        deleteRecord(item.id)
      })

      Toast({ type: 'success', message: 'The recording was deleted successfully' })
    } catch (error) {
      console.log(error)
      Toast({ type: 'error', message: 'Error deleting the recording' })
    }
  }

  return (
    <Box
      sx={{
        height: 500,
        width: '100%',
        '& .MuiDataGrid-columnHeader--filledGroup .MuiDataGrid-columnHeaderTitleContainer': { justifyContent: 'center' },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        experimentalFeatures={{ columnGrouping: true }}
        columnGroupingModel={columnGroupingModel}
        check
        disableRowSelectionOnClick
        onRowDoubleClick={(infoRow) => {
          const infoRowByName = filteredRecords.filter((row) => row?.name == infoRow?.id)
          const transformedData = {}
          infoRowByName.forEach((item) => {
            const key = `${item.name}`
            if (!transformedData[key]) {
              transformedData[key] = {
                name: item.name,
                capturer: item.capturer_id,
                format: item.format ?? 'mp4',
                days: [],
                startAt: item.start_at,
                endAt: item.end_at,
                chunkTime: item.chunk_time ?? '00:00'
              }
            }
            transformedData[key].days.push(item.day)
          })
          setSelectedRow(Object.values(transformedData))
          handleOpenDialog()
        }}
      />
      <EditRecord open={open} handleCloseDialog={handleCloseDialog} selectedRow={selectedRow} />
    </Box>
  )
}

export default TablePeriodic
