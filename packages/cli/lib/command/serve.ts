import 'ulog'
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
  } else {
    mode = _mode
  }

  if (mode === 'development' && watch === false) {
    log.warn('Watch disabled in development mode')
  }

  const app = express()

  if (trustProxy) {
    app.set('trust proxy', trustProxy)
  }

  const config = await prepareConfig({ mode, watch, ...rest })
  const { instance, middleware } = await kopflos(config)
  app.use(middleware)

  await instance.start()

  const server = app.listen(port, host, () => {
    log.info(`Server running on ${port}. API URL: ${config.baseIri}`)
    instance.ready()
  })

  if (config.watch) {
    log.info(`Watch mode. Watching for changes in: ${config.watch.join(', ')}`)
    async function restartServer(path: string) {
      log.info('Changes detected, restarting server')
      log.debug(`Changed file: ${path}`)

      await instance.stop()
      server.close(() => {
        process.send?.('restart')
      })
    }

    chokidar.watch(config.watch, {
      ignoreInitial: true,
    })
      .on('change', restartServer)
      .on('add', restartServer)
      .on('unlink', restartServer)
  }

  process.send?.('ready')
}

process.on('message', run)
