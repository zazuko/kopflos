import 'ulog'
import log from '@kopflos-cms/logger'
import express from 'express'
import * as chokidar from 'chokidar'
import kopflos from '@kopflos-cms/express'
import type { KopflosConfig } from '@kopflos-cms/core'
import { loadConfig } from '../config.js'

interface ServeArgs {
  mode?: 'development' | 'production' | unknown
  config?: string
  port?: number
  host?: string
  trustProxy?: boolean
  variable: Record<string, string>
  watch?: boolean
}

declare module '@kopflos-cms/core' {
  interface KopflosConfig {
    watch?: string[]
  }
}

async function run({
  mode: _mode = 'production',
  watch = _mode === 'development',
  config,
  port = 1429,
  host = '0.0.0.0',
  trustProxy,
  variable,
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

  const { config: loadedConfig, filepath: configPath } = await loadConfig({
    path: config,
  })

  const finalOptions: KopflosConfig = {
    mode,
    ...loadedConfig,
    watch: watch ? [configPath, ...loadedConfig.watch || []] : undefined,
    variables: {
      ...loadedConfig.variables,
      ...variable,
    },
  }

  const app = express()

  if (trustProxy) {
    app.set('trust proxy', trustProxy)
  }

  const { instance, middleware } = await kopflos(finalOptions)
  app.use(middleware)

  await instance.start()

  const server = app.listen(port, host, () => {
    log.info(`Server running on ${port}. API URL: ${finalOptions.baseIri}`)
  })

  if (finalOptions.watch) {
    log.info(`Watch mode. Watching for changes in: ${finalOptions.watch.join(', ')}`)
    async function restartServer(path: string) {
      log.info('Changes detected, restarting server')
      log.debug(`Changed file: ${path}`)

      await instance.stop()
      server.close()
      process.exit(1)
    }

    chokidar.watch(finalOptions.watch, {
      ignoreInitial: true,
    })
      .on('change', restartServer)
      .on('add', restartServer)
      .on('unlink', restartServer)
  }
}

process.on('message', run)
