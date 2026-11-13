/* Process termination is required after cleanup: plugins may retain handles. */
/* eslint-disable n/no-process-exit */
import 'ulog'
import { once } from 'node:events'
import log from '@kopflos-cms/logger'
import express from 'express'
import * as chokidar from 'chokidar'
import kopflos from '@kopflos-cms/express'
import { prepareConfig } from '../config.js'

export interface ServeArgs {
  mode?: 'development' | 'production' | unknown
  config?: string
  port?: number
  host?: string
  trustProxy?: boolean
  variable: Record<string, string>
  watch?: boolean
}

async function run({
  mode: _mode = 'production',
  watch = _mode === 'development',
  port = 1429,
  host = '0.0.0.0',
  trustProxy,
  ...rest
}: ServeArgs) {
  let mode: 'development' | 'production'
  if (_mode !== 'development' && _mode !== 'production') {
    log.warn('Invalid mode, defaulting to "production"')
    mode = 'production'
  }
  else {
    mode = _mode
  }

  if (mode === 'development' && watch === false) {
    log.warn('Watch disabled in development mode')
  }

  const app = express()

  if (trustProxy) {
    app.set('trust proxy', trustProxy)
  }

  const { config, configPath } = await prepareConfig({ mode, watch, ...rest })
  const { instance, middleware } = await kopflos(config, configPath)
  app.use(middleware)

  await instance.start()

  const server = app.listen(port, host, (error?: Error) => {
    if (error) throw error

    log.info(`Server running on ${port}. API URL: ${config.baseIri}`)
    instance.ready()
  })

  const watchPaths = [
    ...config.watch || [],
    ...instance.plugins.flatMap(p => p.watchPaths?.(instance) || []),
  ]
  let watcher: chokidar.FSWatcher | undefined
  let restartTimer: ReturnType<typeof setTimeout> | undefined
  let stopping = false

  async function shutdown() {
    if (stopping) return
    stopping = true
    clearTimeout(restartTimer)

    // Plugins and active connections must not keep an orphaned child alive.
    const timeout = setTimeout(() => process.exit(1), 5000)
    timeout.unref()
    try {
      const closed = new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve())
      })
      server.closeAllConnections()
      await Promise.all([watcher?.close(), instance.stop(), closed])
      process.exit(0)
    }
    catch (error) {
      log.error(error)
      process.exit(1)
    }
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  process.on('SIGHUP', shutdown)

  if (watch) {
    log.info(`Watch mode. Watching for changes in: ${watchPaths.join(', ')}`)
    let restarting = false
    function restartServer(path: string) {
      if (restarting || stopping) return

      clearTimeout(restartTimer)
      restartTimer = setTimeout(() => {
        restarting = true

        log.info('Changes detected, restarting server')
        log.debug(`Changed file: ${path}`)

        process.send?.('restart')
      }, 200)
    }

    watcher = chokidar.watch(watchPaths, {
      cwd: instance.env.kopflos.basePath,
      ignored: /\.d\.ts$/i,
      ignoreInitial: true,
    })
      .on('change', restartServer)
      .on('add', restartServer)
      .on('unlink', restartServer)

    await once(watcher, 'ready')
  }

  process.send?.('ready')
}

// If the supervisor is killed without a catchable signal, IPC still closes.
process.once('disconnect', () => process.kill(process.pid, 'SIGTERM'))
process.once('message', run)
