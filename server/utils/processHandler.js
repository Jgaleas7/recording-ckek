import crossSpawn from 'cross-spawn'

const runningProcessesSpawn = {}

function startProcess({ capturer, command = 'C:/ffmpeg/ffmpeg.exe', args, is_automatic = false }) {

  if (is_automatic) {
    stopProcess(capturer)
  }

  if (!runningProcessesSpawn[capturer]) {
    // stdin must be a pipe so we can send 'q' to ffmpeg for graceful shutdown
    // (Windows has no real signals; childProcess.kill() = TerminateProcess, which
    // prevents ffmpeg from finalizing the file — fatal for MP4's moov atom).
    const childProcess = crossSpawn.spawn(command, args, {
      stdio: ['pipe', 'inherit', 'inherit'],
      detached: true,
    })
    runningProcessesSpawn[capturer] = childProcess

    console.log(childProcess)

    childProcess.on('error', (data) => {
      console.error(`ps stderr: ${data}`);
    })

    childProcess.on('exit', () => {
      delete runningProcessesSpawn[capturer]
    })
    return { status: 200, message: `The recording of "${capturer}" started successfully.` }
  } else {
    console.log(`The process "${capturer}" is already running.`)
    return { status: 409, message: `The recording of "${capturer}" is already running.` }
  }
}

function stopProcess(capturer) {
  const childProcess = runningProcessesSpawn[capturer]
  if (childProcess) {
    delete runningProcessesSpawn[capturer]
    try {
      childProcess.stdin?.write('q\n')
      childProcess.stdin?.end()
    } catch (_) { /* stdin already closed */ }
    // Hard-kill fallback if ffmpeg doesn't exit within 5s
    setTimeout(() => {
      if (!childProcess.killed && childProcess.exitCode === null) {
        childProcess.kill()
      }
    }, 5000)
    return { status: 200, message: `The recording of "${capturer}" stopped successfully.` }
  } else {
    console.log(`The process "${capturer}" is not running.`)
    return { status: 404, message: `The process "${capturer}" is not running.` }
  }
}

/* function startProcess(name, command, args) {
  console.log(runningProcessesSpawn)
  if (!runningProcessesSpawn[name]) {
    const childProcess = spawn(command, args, { stdio: 'inherit' });
    runningProcessesSpawn[name] = childProcess;
    childProcess.on('exit', () => {
      delete runningProcessesSpawn[name];
    });
  } else {
    console.log(`El proceso "${name}" ya está en ejecución.`);
  }
}

function stopProcess(name) {
  const childProcess = runningProcessesSpawn[name];
  if (childProcess) {
    childProcess.kill();
    delete runningProcessesSpawn[name];
  } else {
    console.log(`El proceso "${name}" no está en ejecución.`);
  }
}
 */
export { startProcess, stopProcess }
