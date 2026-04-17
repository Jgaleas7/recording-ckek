import 'dotenv/config'
import { currentDate } from './date.js'

export const args = (decklinkOutput, nameOfVideo, chunkTimeInSeconds) => {

  if (chunkTimeInSeconds) {
    return [
      '-f',
      'decklink',
      '-i',
      `DeckLink Duo (${decklinkOutput})`,
      '-f',
      'segment',
      '-segment_time',
      `${chunkTimeInSeconds}`,
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
      `C:\\recordings\\${currentDate()}_${Date.now()}_${nameOfVideo}_0%d.mxf`,
    ]
  }

  return [
    '-thread_queue_size', '1024',
    '-f', 'decklink',
    '-i', `DeckLink Duo (${decklinkOutput})`,
    // MXF master (CPU)
    '-map', '0:v', '-map', '0:a',
    '-c:v', 'mpeg2video', '-pix_fmt', 'yuv422p',
    '-b:v', '35000k', '-minrate', '35000k', '-maxrate', '35000k', '-bufsize', '17500k',
    '-g:v', '12', '-bf:v', '2',
    '-flags', '+ildct+ilme', '-top', '1', '-alternate_scan:v', '1',
    '-color_primaries:v', 'bt709', '-color_trc:v', 'bt709', '-colorspace:v', 'bt709',
    '-c:a', 'pcm_s24le',
    '-f', 'mxf',
    `C:\\recordings\\${currentDate()}_${Date.now()}_${nameOfVideo}.mxf`,
  ]
}
