import type http from 'http'
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

export default async function ({
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
    log.warn('Watch mode disabled in development mode')
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

  let server: http.Server

  async function startServer() {
    const app = express()

    if (trustProxy) {
      app.set('trust proxy', trustProxy)
    }

    const { instance, middleware } = await kopflos(finalOptions)
    app.use(middleware)

    await instance.start()

    return new Promise<http.Server>((resolve) => {
      const server = app.listen(port, host, () => {
        log.info(`Server running on ${port}. API URL: ${finalOptions.baseIri}`)
        resolve(server)
      })

      server.on('close', () => {
        instance.stop()
      })
    })
  }

  server = await startServer()

  if (finalOptions.watch) {
    log.info(`Watch mode. Watching for changes in: ${finalOptions.watch.join(', ')}`)

    chokidar.watch(finalOptions.watch)
      .on('change', async (path) => {
        log.info('Changes detected, restarting server')
        log.debug(`Changed file: ${path}`)

        server.close(async () => {
          server = await startServer()
        })
      })
  }
}
