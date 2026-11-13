import { fork, type ChildProcess } from 'node:child_process'
import log from '@kopflos-cms/logger'
import type { ServeArgs } from './command/serve.js'

interface Runtime {
  on(signal: NodeJS.Signals, listener: () => void): void
  off(signal: NodeJS.Signals, listener: () => void): void
  exitCode: NodeJS.Process['exitCode']
}

interface Dependencies {
  spawn?: () => ChildProcess
  runtime?: Runtime
  shutdownTimeout?: number
}

export function serve(options: ServeArgs, {
  spawn = () => fork(new URL('./command/serve.js', import.meta.url)),
  runtime = process,
  shutdownTimeout = 5000,
}: Dependencies = {}) {
  let child: ChildProcess
  let restarting = false
  let stopping = false
  let killTimer: ReturnType<typeof setTimeout> | undefined
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const

  function terminate(signal: NodeJS.Signals = 'SIGTERM') {
    if (killTimer) return

    child.kill(signal)
    killTimer = setTimeout(() => child.kill('SIGKILL'), shutdownTimeout)
  }

  function shutdown() {
    stopping = true
    terminate()
  }

  function cleanup() {
    clearTimeout(killTimer)
    killTimer = undefined
    for (const signal of signals) {
      runtime.off(signal, shutdown)
    }
  }

  function start() {
    // A fresh process bypasses the Node module cache on every restart.
    child = spawn()
    child.on('message', (message) => {
      if (message === 'restart') {
        if (restarting || stopping) return

        restarting = true
        terminate()
      }
      else if (message !== 'ready') {
        log.error(`Unknown message: ${message}`)
      }
    })
    child.once('error', (error) => {
      log.error(error)
      stopping = true
      runtime.exitCode = 1
      terminate()
    })
    // `close` also fires when spawning fails, whereas `exit` may not.
    child.once('close', (code, signal) => {
      child.removeAllListeners('message')
      clearTimeout(killTimer)
      killTimer = undefined
      if (restarting && !stopping) {
        restarting = false
        start()
      }
      else {
        cleanup()
        runtime.exitCode ??= stopping ? 0 : (code ?? (signal ? 1 : 0))
      }
    })
    child.send(options)
  }

  for (const signal of signals) {
    runtime.on(signal, shutdown)
  }
  start()
}
