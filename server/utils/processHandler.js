import crossSpawn from 'cross-spawn'

const runningProcessesSpawn = {}

function startProcess({ capturer, command = 'C:/ffmpeg/ffmpeg.exe', args, is_automatic = false }) {

  if (is_automatic) {
    stopProcess(capturer)
  }

  if (!runningProcessesSpawn[capturer]) {
    const childProcess = crossSpawn.spawn(command, args, { stdio: 'inherit', detached: true })
    runningProcessesSpawn[capturer] = childProcess

    console.log(childProcess)

    childProcess.on('error', (data) => {
      console.error(`ps stderr: ${data}`);
    })

    childProcess.on('exit', () => {
      delete runningProcessesSpawn[capturer]
    })
    return { status: 200, message: `La grabación del "${capturer}" se inició correctamente.` }
  } else {
    console.log(`El proceso "${capturer}" ya está en ejecución.`)
    return { status: 409, message: `La grabación del "${capturer}" ya está en ejecución.` }
  }
}

function stopProcess(capturer) {
  const childProcess = runningProcessesSpawn[capturer]
  if (childProcess) {
    childProcess.kill()
    delete runningProcessesSpawn[capturer]
    return { status: 200, message: `La grabación del "${capturer}" se detuvo correctamente.` }
  } else {
    console.log(`El proceso "${capturer}" no está en ejecución.`)
    return { status: 404, message: `El proceso "${capturer}" no está en ejecución.` }
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
