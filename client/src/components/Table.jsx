import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import useRecordStore from '../store/recorderStore'

const TableNow = ({ activeRow }) => {
  const filteredRecords = useRecordStore((state) => state.filteredRecords)
  const capturer = useRecordStore((state) => state.capturer)
  const filterRecordsByCapturerAndDay = useRecordStore((state) => state.filterRecordsByCapturerAndDay)

  // Actualizar cuando cambie el capturer
  useEffect(() => {
    filterRecordsByCapturerAndDay(capturer)
  }, [capturer])

  return (
    <TableContainer component={Paper} sx={{ width: '100%' }}>
      <Table sx={{ width: '100%' }} aria-label='simple table'>
        <TableHead>
          <TableRow>
            <TableCell align='left'>Start</TableCell>
            <TableCell align='left'>End</TableCell>
            <TableCell align='left'>Title</TableCell>
            <TableCell align='left'>Type</TableCell>
            <TableCell align='left'>Segment</TableCell>
            <TableCell align='left'>Capturer</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRecords?.length > 0 ? (
            filteredRecords?.map((row) => (
              <TableRow
                key={row?.id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  backgroundColor: `${row?.id === activeRow[capturer] && row?.capturers?.name === capturer ? '#00ab55' : ''}`,
                }}
              >
                <TableCell component='th' scope='row'>
                  {row?.start_at}
                </TableCell>
                <TableCell align='left'>{row?.end_at}</TableCell>
                <TableCell align='left'>{row?.name}</TableCell>
                <TableCell align='left'>Periodic</TableCell>
                <TableCell align='left'>{row?.chunk_time ? `${row?.chunk_time} min` : '0'} </TableCell>
                <TableCell align='left'>{row?.capturers?.name}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow key='1'>
              <TableCell colSpan='5' align='center' component='th' scope='row'>
                There are no recordings today
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default TableNow