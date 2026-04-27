import 'dotenv/config'
import { currentDate } from './date.js'

const videoArgsForFormat = (format) => {
  if (format === 'mxf') {
    return [
      '-c:v', 'mpeg2video',
      '-pix_fmt', 'yuv422p',
      '-b:v', '35M', '-minrate', '35M', '-maxrate', '35M', '-bufsize', '17500k',
      '-g', '12', '-bf', '2',
      '-flags', '+ildct+ilme',
      '-top', '1',
      '-alternate_scan:v', '1',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    ]
  }
  return [
    '-vf', 'format=yuv422p',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-profile:v', 'high422',
    '-flags', '+ilme+ildct',
    '-field_order', 'tt',
    '-x264-params', 'tff=1',
    '-b:v', '25M', '-maxrate', '25M', '-bufsize', '50M',
    '-g', '15', '-bf', '0',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  ]
}

const audioArgsForFormat = (format) => {
  if (format === 'mxf') {
    return ['-filter:a', 'pan=stereo|c0=c0|c1=c1', '-c:a', 'pcm_s24le']
  }
  return ['-filter:a', 'pan=stereo|c0=c0|c1=c1', '-c:a', 'aac', '-b:a', '192k']
}

export const args = (decklinkOutput, nameOfVideo, chunkTimeInSeconds, format = 'mp4') => {
  const ext = format === 'mxf' ? 'mxf' : 'mp4'
  const inputArgs = [
    '-thread_queue_size', '1024',
    '-f', 'decklink',
    '-i', `DeckLink Duo (${decklinkOutput})`,
    '-map', '0:v', '-map', '0:a',
  ]

  if (chunkTimeInSeconds) {
    return [
      ...inputArgs,
      ...videoArgsForFormat(format),
      ...audioArgsForFormat(format),
      '-f', 'segment',
      '-segment_time', `${chunkTimeInSeconds}`,
      '-segment_format', ext,
      '-threads', '0',
      `C:\\recordings\\${currentDate()}_${Date.now()}_${nameOfVideo}_0%d.${ext}`,
    ]
  }

  const containerArgs = format === 'mp4'
    ? ['-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof']
    : ['-f', 'mxf']

  return [
    ...inputArgs,
    ...videoArgsForFormat(format),
    ...audioArgsForFormat(format),
    ...containerArgs,
    '-threads', '0',
    `C:\\recordings\\${currentDate()}_${Date.now()}_${nameOfVideo}.${ext}`,
  ]
}
