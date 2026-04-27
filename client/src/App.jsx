import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'

import Grid from '@mui/material/Unstable_Grid2'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import RecordingControls from './components/RecordingControls'

import Header from './components/Header'
import useRecordStore from './store/recorderStore'

import { supabase } from './config/supabase'
import { CAPTURERS, CAPTURER_NAMES, borderControls } from './const'
import TabsSection from './components/TabsSection'
import InputSettings from './components/InputSettings'
import useBeforeUnload from './hooks/useBeforeUnload'
import useRefreshAtMidnight from './hooks/useRefreshAtMidnight'

function App() {
  const allRecords = useRecordStore((state) => state.allRecords)
  const filterRecordsByCapturerAndDay = useRecordStore((state) => state.filterRecordsByCapturerAndDay)
  const filterRecordsByCapturer = useRecordStore((state) => state.filterRecordsByCapturer)
  const changeActiveTabIndex = useRecordStore((state) => state.changeActiveTabIndex)
  const changeCapturer = useRecordStore((state) => state.changeCapturer)
  const changeFormat = useRecordStore((state) => state.changeFormat)
  const [activeRecordRowId, setActiveRecordRowId] = useState(() => {
    const savedActiveRows = localStorage.getItem('activeRecordRows')
    return savedActiveRows ? JSON.parse(savedActiveRows) : {
      capturer1: null,
      capturer2: null,
      capturer3: null,
      capturer4: null,
    }
  })
  const [capturer, setCapturer] = useState(CAPTURERS.capturer1)
  const [format, setFormat] = useState('mp4')

  useEffect(() => {
    changeFormat(format)
  }, [format])
  const [tabIndex, setTabIndex] = useState(0)
  const { Modal } = useBeforeUnload();

  useRefreshAtMidnight()

  useEffect(() => {
    const onRecords = supabase
      .channel('table-capturers')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'capturers' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          console.log('Payload received:', payload)

          // Query both capturers to ensure we have the latest state for both
          const fetchBothCapturers = async () => {
            try {
              const { data, error } = await supabase
                .from('capturers')
                .select('name, record_active_id')
                .in('name', CAPTURER_NAMES)

              if (error) throw error

              if (data && data.length > 0) {
                // Create new state object with updated data for both capturers
                const newActiveRows = { ...activeRecordRowId }

                data.forEach(capturer => {
                  newActiveRows[capturer.name] = capturer.record_active_id || null
                })

                setActiveRecordRowId(newActiveRows)
                localStorage.setItem('activeRecordRows', JSON.stringify(newActiveRows))
              }
            } catch (error) {
              console.error('Error fetching capturer states:', error)
            }
          }

          // Instead of trying to update based on the payload, fetch fresh data for both capturers
          fetchBothCapturers()
          return
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(onRecords)
    }
  }, [])

  useEffect(() => {
    const fetchActiveRecords = async () => {
      try {
        // Consultar los capturadores para obtener sus record_active_id
        const { data, error } = await supabase
          .from('capturers')
          .select('name, record_active_id')
          .in('name', CAPTURER_NAMES)

        if (error) throw error

        // Si tenemos datos, actualizar el estado con ellos
        if (data && data.length > 0) {
          const newActiveRows = { ...activeRecordRowId }

          data.forEach(capturer => {
            newActiveRows[capturer.name] = capturer.record_active_id || null
          })

          setActiveRecordRowId(newActiveRows)

          // Guardar en localStorage
          localStorage.setItem('activeRecordRows', JSON.stringify(newActiveRows))
        }
      } catch (error) {
        console.error('Error cargando registros activos:', error)
      }
    }

    fetchActiveRecords()
  }, [])

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('records').select('*, capturers(name)')

      if (error) {
        console.error('Error al cargar registros:', error)
        return
      }

      allRecords(data)
      filterRecordsByCapturerAndDay(capturer)
      changeCapturer(capturer)
    }
    fetchData()
    localStorage.setItem('lastCheckedDate', new Date().toDateString())
  }, [])

  const handleChangeCapturer = (event) => {
    const capturer = event.target.value
    filterRecordsByCapturerAndDay(capturer)
    changeCapturer(capturer)
    setCapturer(capturer)
    setTabIndex(0)
  }

  const handleChangeFormat = (event) => {
    setFormat(event.target.value)
  }

  const handleChangeTab = (event, newValue) => {
    if (newValue === 0) {
      filterRecordsByCapturerAndDay(capturer)
    } else {
      filterRecordsByCapturer(capturer)
    }
    changeActiveTabIndex(newValue)
    setTabIndex(newValue)
  }

  return (
    <>
      <Header activeRecordRowId={activeRecordRowId} />


      <Box sx={{ padding: '2rem' }} component={'main'}>
        <Grid container spacing={2} rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} margin={0}>
          <Grid xs={4} sx={borderControls}>
            <InputSettings capturer={capturer} format={format} handleChangeCapturer={handleChangeCapturer} handleChangeFormat={handleChangeFormat} />
          </Grid>
          <Grid xs={4} sx={borderControls} />
          <Grid xs={4} sx={borderControls}>
            <RecordingControls />
          </Grid>
        </Grid>
        <Grid textAlign='center' marginY={3}>
          <Typography variant='h5'>Recording: 00:00:00</Typography>
        </Grid>
        <TabsSection tabIndex={tabIndex} activeRecordRowId={activeRecordRowId} handleChangeTab={handleChangeTab} />
        <ToastContainer />
      </Box>
      <Modal />
    </>
  )
}

export default App
