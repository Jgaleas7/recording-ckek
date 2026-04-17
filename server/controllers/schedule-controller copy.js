import cron from 'node-cron'
import { startProcess, stopProcess } from '../utils/processHandler.js'
import { supabase } from '../db.js'
import { args } from '../utils/args.js'
import { CAPTURERS } from '../const/index.js'
import { logger } from '../utils/winston.js'

const startSchedules = async (req, res) => {
  const { data, error, status } = await supabase.from('records').select('*, capturers(*)')
  if (status == 200) {
    data.forEach((task) => {
      const { id, day, name, start_at, end_at, chunk_time, capturers } = task
      const { name: nameCapturer } = capturers

      const decklinkOutput = nameCapturer === CAPTURERS.capturer1 ? 3 : 4
      const chunkTimeInSeconds = parseInt(chunk_time) * 60 

      const parameters = args(decklinkOutput, name, chunkTimeInSeconds)

      const startTimeSplitter = start_at.split(':')
      const endTimeSplitter = end_at.split(':')
      const [startHour, startMinutes, startSeconds] = startTimeSplitter
      const [endHour, endMinutes, endSeconds] = endTimeSplitter

      const cronPatternStartRecord = `${startSeconds} ${startMinutes} ${startHour} * * ${day}`
      const cronPatternEndRecord = `${endSeconds} ${endMinutes} ${endHour} * * ${day}`

      const taskFunctionStart = async () => {
        
        const { status, message } = startProcess({ capturer: nameCapturer, command: 'ffmpeg', args: parameters, is_automatic: true })
        try {
          const { error, data, status } = await supabase
            .from('capturers')
            .update({ is_active: true, is_automatic: true, record_active_id: id })
            .eq('name', nameCapturer)
          if (status === 200) {
            console.log(`Running task "${name}" on ${day} at ${start_at}`)
          }
        } catch (error) {
          console.log(error)
        }
      }
      const taskFunctionEnd = async () => {
        const { status, message } = stopProcess(nameCapturer)
          try {
            const { error, data, status } = await supabase
              .from('capturers')
              .update({ is_active: false, is_automatic: false, record_active_id: null })
              .eq('name', nameCapturer)
            if (status === 200) {
              console.log(`Ending task "${name}" on ${day} at ${end_at}`)
            }
          } catch (error) {
            console.log(error)
          }
      }

      cron.schedule(cronPatternStartRecord, taskFunctionStart, {
        scheduled: true,
        timezone: 'America/Tegucigalpa',
      })

      cron.schedule(cronPatternEndRecord, taskFunctionEnd, {
        scheduled: true,
        timezone: 'America/Tegucigalpa',
      })
    })
    return res.status(200).json(data)
  }
  return res.status(status).json({ message: error.message })
}

export { startSchedules }
