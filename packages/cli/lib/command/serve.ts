import log from '@kopflos-cms/logger'
import express from 'express'
import kopflos from '@kopflos-cms/express'
import { loadConfig } from '../config.js'

interface ServeArgs {
  mode?: 'development' | 'production' | unknown
  config?: string
  port?: number
  host?: string
  trustProxy?: boolean
  variable: Record<string, string>
}

export default async function ({
  mode: _mode = 'production',
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

  const loadedConfig = await loadConfig({
    path: config,
  })

  const finalOptions = {
    port,
    host,
    mode,
    ...loadedConfig,
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

  app.listen(port, host, () => {
    log.info(`Server running on ${port}. API URL: ${finalOptions.baseIri}`)
  })
}
