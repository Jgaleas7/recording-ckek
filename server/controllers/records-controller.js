import { startProcess, stopProcess } from '../utils/processHandler.js'
import fs from 'fs'
import path from 'path'
import { supabase } from '../db.js'
import { CAPTURERS, capturerToDecklink } from '../const/index.js'
import { logger } from '../utils/winston.js'
import { currentDate } from '../utils/date.js'

import { BasicCasparCGAPI, Commands } from 'casparcg-connection'
import axios from 'axios'
import { args } from '../utils/args.js'

const cg = new BasicCasparCGAPI()
//const connection = new CasparCG()

const startRecord = async (req, res) => {
  const { capturer, nameOfVideo } = req.body;
  const decklinkOutput = capturerToDecklink(capturer);
  const commandArgs = args(decklinkOutput, nameOfVideo, null);
  try {

    const { status, message } = startProcess({ capturer, command: 'C:/ffmpeg/ffmpeg.exe', args: commandArgs })
    
    if (status !== 200) {
      return res.status(status).json({ error: message })
    }

    const { error } = await supabase.from('capturers').update({ is_active: true }).eq('name', capturer);

    if (error) {
      logger.error(`Error al actualizar el estado del capturer ${capturer}: ${error.message}`);
      return res.status(500).json({ error: 'Error al actualizar el estado del capturer' });
    }

    logger.info(`La grabacion del ${capturer} ha iniciado correctamente`);
    return res.status(200).json({ data: `La grabacion del ${capturer} ha iniciado correctamente` });

  } catch (error) {
    console.log("error catch");
    //console.log(error);
    //logger.error(`Error al iniciar la grabación: ${error.message}`);
    return res.status(500).json({ error: 'Error al iniciar la grabación' });
  }
}

const stopRecord = async (req, res) => {
  const { capturer, nameOfVideo, isStopAutomatic = false } = req.body;

  try {
    const { status, message } = stopProcess(capturer);
    
    if (status === 404) {
      console.log(`Stop command: ${message}`);
    }

    let rawInfo = { is_active: false, is_automatic: false }

    if (isStopAutomatic) {
      rawInfo = { ...rawInfo, record_active_id: null }
    }

    const { error } = await supabase.from('capturers').update(rawInfo).eq('name', capturer);
    if (error) {
      logger.error(`Error al actualizar el estado del capturer ${capturer}: ${error.message}`);
      return res.status(500).json({ error: 'Error al actualizar estado en base de datos' });
    }

    logger.info(`La grabacion del ${capturer} se detuvo correctamente`);
    return res.status(200).json({ data: `La grabacion del ${capturer} se detuvo correctamente` });

  } catch (error) {
    console.log(error);
    logger.error(`Error al detener la grabación: ${error.message || 'Error desconocido'}`);
    return res.status(500).json({ error: 'Error al detener la grabación' });
  }
}

const renameVideo = (req, res) => {
  const { FileName, NewFileName } = req.body
  try {
    const recordingsDir = 'C:\\recordings';
    let oldPath = FileName.includes(':\\') ? FileName : path.join(recordingsDir, FileName);
    
    // Si el archivo no existe exactamente con ese nombre, buscar concidencias por el prefijo de la fecha
    if (!fs.existsSync(oldPath)) {
      const baseName = path.basename(FileName);
      const files = fs.readdirSync(recordingsDir);
      const matchedFile = files.find(f => f.endsWith(baseName));
      if (matchedFile) {
        oldPath = path.join(recordingsDir, matchedFile);
      }
    }

    let newBaseName = path.basename(NewFileName);
    const datePrefix = `${currentDate()}_`;
    
    if (!newBaseName.startsWith(datePrefix)) {
      newBaseName = `${datePrefix}${newBaseName}`;
    }

    const newPath = path.join(recordingsDir, newBaseName);

    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        logger.error(`Rename failure: ${err.message}`)
        return res.status(400).json({ error: err.message })
      }
      logger.info(`La grabación se renombro a ${NewFileName}`)
      return res.status(200).json({ message: 'Rename complete!' })
    });
  } catch (error) {
    logger.error(`Rename: error al renombar video -> ${error.message}`)
    return res.status(400).json(error.message)
  }
}

/* const { capturer, nameOfVideo } = req.body

const decklinkOutput = capturer === CAPTURERS.capturer1 ? 1 : 2

const args = [
  '-f',
  'decklink',
  '-i',
  `DeckLink Duo (${decklinkOutput})`,
  '-codec:v',
  'mpeg2video',
  '-pix_fmt',
  'yuv422p',
  '-color_primaries:v',
  'bt709',
  '-color_trc:v',
  '1',
  '-colorspace:v',
  '1',
  '-filter:a',
  'pan=stereo|c0=c0|c1=c1',
  '-f',
  'mxf',
  '-alternate_scan:v',
  '1',
  '-g:v',
  '12 ',
  '-bf:v',
  '2',
  '-b:v',
  '35000k',
  '-minrate',
  '35000k',
  '-maxrate',
  '35000k',
  '-preset',
  'slow',
  '-flags',
  '+ildct+ilme',
  '-top',
  '1',
  `C:\\records/${nameOfVideo}.mxf`
  /* `\\\\192.168.100.230\\d\\TEST_RECORDS/${nameOfVideo}.mxf`, 
  /* `${process.env.PATH_TO_SAVE_VIDEO}/${nameOfVideo}.mxf`,
] */

//cg.connect('localhost', 5250)

/* const {errorPlay, requestPlay } = await cg.executeCommand({
  command: Commands.PlayDecklink,
  params:{
    channel:1,
    device: 1,
    layer: 1
  }
})
if(errorPlay){
  console.log("error play", errorPlay)
}else{
  const r= await requestPlay
  console.log(r, "response play")
} */

/* const { error: errorAdd, request: requestAdd } = await cg.executeCommand({
  command: Commands.Add,
  params: {
    channel: 1,
    consumer: 'FILE',
    parameters: 'C://records/test222.mp4 -codec:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -r 29.97 -flags +ilme+ildct -vf "interlace=lowpass=1"',
    /* parameters: 'C://records/test222.mp4 -codec:v libx264 -crf 18 -preset:v default -pixel_format:v yuv420p -r 29.97 -flags +ilme+ildct -filter:v "interlace=lowpass=1"', 
    /* parameters: 'C://records/prueba.mp4 -codec:v libx264 -crf:v 23 -preset:v veryfast -filter:v format=pix_fmts=yuv420p,tinterlace=4 -flags:v +ildct+ilme -codec:a aac -b:a 128k -ar:a 48k -filter:a pan=stereo|c0=c0|c1=c2', 
    /* -codec:v h264_nvenc -profile:v high444p -pixel_format:v yuv444p -preset:v default 
  },
}) */

/*   if (errorAdd) {
    console.log('Error when sending', errorAdd)
} else {
    const response = await requestAdd
    console.log(response)
} */

/* const { errorAdd, requestAdd } = await connection.add({consumer: "File", parameters: "C://records/prueba.mxf -b:v 35000000 -codec:a pcm_s24le -codec:v mpeg2video -filter:v interlace,zscale=rangein=full:range=limited:primaries=709:transfer=709:matrix=709,format=yuv420p -alternate_scan:v 1 -g:v 12 -bf:v 2 -minrate:v 35000k -maxrate:v 35000k -color_primaries:v bt709 -color_trc:v 1 -colorspace:v 1 -filter:a pan=stereo|c0=c0|c1=c1", channel: 1})
if (error) {
    console.log('Error when sending', errorAdd)
} else {
    const response = await requestAdd
    console.log(response)
} */

/* const { status, message } = startProcess({ capturer, command: 'ffmpeg', args })

if (status == 200) {
 try {
  const { error, data } = await supabase.from('capturers').update({ is_active: true }).eq('name', capturer)
  if (error) throw error;

  logger.info(`La grabación del ${capturer} ha iniciado correctamente`)

  return res.status(status).json(message)
 } catch (error) {
    console.log(error)
    logger.error(`Start Record: La grabación del ${capturer} ha dado error: ${error.message}`)
    return res.status(400).json(error.message)
 }
}*/











/* const { capturer } = req.body
//const { status, message } = stopProcess(capturer)
 

const { error, request } = await cg.executeCommand({
  command: Commands.Remove,
  params: { channel: 1, consumer: `FILE C://records/test222.mp4` },
})

if (error) {
  res.status(500).json({ message: error })
  console.log('Error when sending', error)
} else {
  const response = await request
  res.status(200).json({ message: response })
  console.log(response)
} */

/* if (status === 200) {
  try {
    const { error, data } = await supabase.from('capturers').update({ is_active: false, is_automatic: false }).eq('name', capturer)
    if (error) throw error;
    
    logger.info(`La grabación del ${capturer} se detuvo correctamente`)

    return res.status(200).json({message})
  } catch (error) {
    console.log(error)
    logger.error(`Stop Record: La grabación del ${capturer} ha dado error: ${error.message}`)
    return res.status(400).json(error.message)
  }
}
else{
  return res.status(400).json(message)
} */


/* const childProcesses = {};
function startChildProcess(identifier) {
  const childProcess = spawn('node', ['child.js']);
  childProcesses[identifier] = childProcess;
  childProcess.on('close', () => {
    console.log(`El proceso hijo ${identifier} se ha cerrado.`);

    delete childProcesses[identifier];
  });
}
function stopChildProcess(identifier) {
  if (childProcesses[identifier]) {
    childProcesses[identifier].kill();
    console.log(`El proceso hijo ${identifier} se ha detenido.`);
  } else {
    console.log(`No se encontró el proceso hijo ${identifier}.`);
  }
}
 */
/* const { BasicCasparCGAPI, Commands } = require('casparcg-connection');
const {startProcess, stopProcess} = require('../utils/processHandler');

const recordVideo = async (req, res) => {    

  const args = [
    '-f', 'decklink',
    '-i', 'DeckLink Duo (3)',
    '-codec:v', 'mpeg2video',
    '-pix_fmt', 'yuv422p',
    '-color_primaries:v', 'bt709', 
    '-color_trc:v', '1', 
    '-colorspace:v', '1', 
    '-filter:a', 'pan=stereo|c0=c0|c1=c1',
    '-f', 'mxf', 
    '-alternate_scan:v', '1',
    '-g:v', '12 ',
    '-bf:v', '2',
    '-b:v', '35000k',
    '-minrate', '35000k',
    '-maxrate', '35000k',
    '-preset', 'slow',
    '-flags', '+ildct+ilme',
    '-top','1',
    'C:/Users/vmixs2/Documents/prueba.mxf'
  ]

  startProcess('capturer1', 'peg', args)


  record.stdout.on('data', (data) => {
    res.status(200).json({ message: "Record OK" })
    console.log(data.toString());
  });

  record.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  record.on('error', (err) => {
    console.log(err.toString());
  });

  record.on('close', (code) => {
    console.log(code)
    if (code === 0) {
      console.log('Proceso secundario iniciado correctamente');

    } else {
      console.log(`El proceso secundario finalizó con un código de salida no exitoso: ${code}`);
    }
  });

  res.status(200).json({ message: "Record OK" })
  const cg = new BasicCasparCGAPI()
  const { channel, format } = req.body

  cg.connect('localhost', 5250)

  const { error, request } = await cg.executeCommand({
    command: Commands.PlayDecklink,
    params: { channel: 1, layer: 1, device: 2 },
  }) */
/* 
  const { error, request } = await cg.executeCommand({
    command: Commands.Play,
    params: { channel: channel, layer: 1, clip: 'C://media//faf.mxf' },
  })

  if (error) {
    console.log('Error when sending', error)
  } else {
    const response = await request
    console.log(response)
  }

  const { error: errorAdd, request: requestAdd } = await cg.executeCommand({
    command: Commands.Add,
    params: {
      channel: 1,
      consumer: 'FILE',
      parameters: 'C://media//prueba.mp4 ',
    },
  })
   const { error: errorAdd, request: requestAdd } = await cg.executeCommand({
        'C://media//prueba.mxf -c:v mpeg2video -pix_fmt yuv422p -b:v 50M -minrate 50M -maxrate 50M -bufsize 10M -r 30000/1001 -c:a pcm_s16le -ar 48000 -ac 2 -s 1920x1080',
    command: Commands.Add,
    params: {
      channel: 1,
      consumer: 'FILE',
      parameters:
        'C://media//fafc.mxf -c:v mpeg2video -pix_fmt yuv422p -b:v 50M -minrate 50M -maxrate 50M -bufsize 10M -r 30000/1001 -c:a pcm_s16le -ar 48000 -ac 2 -s 1920x1080',
    },
  })
  //-b:v 50000000 -codec:v mpeg2video -codec:a pcm_s16le -filter:v interlace,zscale=rangein=full:range=limited:primaries=709:transfer=709:matrix=709,format=yuv422p
  //-vcodec libx264 -acodec aac -s 1920x1080
  //-b:v 35000000 -codec:a pcm_s24le -codec:v mpeg2video -filter:v interlace,zscale=rangein=full:range=limited:primaries=709:transfer=709:matrix=709,format=yuv420p -alternate_scan:v 1 -g:v 12 -bf:v 2 -minrate:v 35000k -maxrate:v 35000k -color_primaries:v bt709 -color_trc:v 1 -colorspace:v 1 -filter:a pan=stereo|c0=c0|c1=c1
  //-b:v 35000000 -codec:a pcm_s24le -codec:v mpeg2video -filter:v interlace,zscale=rangein=full:range=limited:primaries=709:transfer=709:matrix=709,format=yuv420p -alternate_scan:v 1 -g:v 12 -bf:v 2 -minrate:v 35000k -maxrate:v 35000k -color_primaries:v bt709 -color_trc:v 1 -colorspace:v 1 -filter:a pan=stereo|c0=c0|c1=c1
  //-c:v mpeg2video -pix_fmt yuv422p -b:v 50M -minrate 50M -maxrate 50M -bufsize 10M -c:a pcm_s16le
  //-c:v mpeg2video -pix_fmt yuv422p -b:v 50M -minrate 50M -maxrate 50M -bufsize 10M -field_order tff -r 60000/1001 -c:a pcm_s16le -ar 48000 -ac 2

  //-c:v mpeg2video -pix_fmt yuv422p -b:v 50M -minrate 50M -maxrate 50M -bufsize 10M -r 30000/1001 -c:a pcm_s16le -ar 48000 -ac 2 -s 1920x1080

  if (errorAdd) {
    res.status(500).json({ message: error })
    console.log('Error when sending', errorAdd)
  } else {
    const response = await requestAdd
    console.log(response)
    res.status(200).json({ message: response })
  }
  cg.disconnect()



  //'C://media//tn52.mxf -codec:v mpeg2video -codec:a pcm_s16le -filter:v format=pix_fmts=yuv422p,scale=720x576,fps=25,setdar=16/9 -filter:a pan=stereo|c0=c0|c1=c1',
  //'C://media//tn52.mxf -b:v 35000000 -codec:a pcm_s24le -codec:v mpeg2video -filter:v interlace,zscale=rangein=full:range=limited:primaries=709:transfer=709:matrix=709,format=yuv420p -alternate_scan:v 1 -g:v 12 -bf:v 2 -minrate:v 35000k -maxrate:v 35000k -color_primaries:v bt709 -color_trc:v 1 -colorspace:v 1 -filter:a pan=stereo|c0=c0|c1=c1',
}

const stopRecord = async (req, res) => {

  stopProcess('capturer1');

  const cg = new BasicCasparCGAPI()
  const { channel, nameOfVideo } = req.body

  cg.connect('localhost', 5250)

  const { error, request } = await cg.executeCommand({
    command: Commands.Remove,
    params: { channel: 1, consumer: `FILE C://media//prueba.mp4` },
  })

  if (error) {
    res.status(500).json({ message: error })
    console.log('Error when sending', error)
  } else {
    const response = await request
    res.status(200).json({ message: response })
    console.log(response)
  }

  cg.disconnect()
}
 */

export { startRecord, stopRecord, renameVideo }





/*
    -f decklink -i "DeckLink Duo (3)" -codec:v mpeg2video -pix_fmt yuv422p -color_primaries:v bt709 -color_trc:v 1 -colorspace:v 1 -filter:a pan=stereo|c0=c0|c1=c1 -f mxf -alternate_scan:v 1 -g:v 12 , -bf:v 2, -b:v 35000k -minrate 35000k -maxrate 35000k -preset slow -flags +ildct+ilme -top 1

    -f decklink -i "DeckLink Duo (3)"



    ADD 1 FILE “Test stereo feed.mxf” -b:v 35000000 -codec:a pcm_s24le -codec:v mpeg2video -filter:v interlace,zscale=rangein=full:range=limited:primaries=709:transfer=709:matrix=709,format=yuv420p -alternate_scan:v 1 -g:v 12 -bf:v 2 -minrate:v 35000k -maxrate:v 35000k -color_primaries:v bt709 -color_trc:v 1 -colorspace:v 1 -filter:a pan=stereo|c0=c0|c1=c1
*/