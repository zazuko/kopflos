import 'ulog'
import express from 'express'
import { program } from 'commander'
import kopflos from '@kopflos-cms/express'
import Kopflos, { log } from '@kopflos-cms/core'
import { loadPlugins } from '@kopflos-cms/core/plugins.js' // eslint-disable-line import/no-unresolved
import { loadConfig } from './lib/config.js'
import { variable } from './lib/options.js'

program.name('kopflos')

interface ServeArgs {
  mode?: 'development' | 'production' | unknown
  config?: string
  port?: number
  host?: string
  trustProxy?: boolean
  variable: Record<string, string>
}

program.command('serve')
  .description('Start the server')
  .option('-m, --mode <mode>', 'Mode to run in (default: "production")')
  .option('-c, --config <config>', 'Path to config file')
  .option('-p, --port <port>', 'Port to listen on (default: 1429)', parseInt)
  .option('-h, --host <host>', 'Host to bind to (default: "0.0.0.0")')
  .addOption(variable)
  .option('--trust-proxy [proxy]', 'Trust the X-Forwarded-Host header')
  .action(async ({ mode: _mode = 'production', config, port = 1429, host = '0.0.0.0', trustProxy, variable }: ServeArgs) => {
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
  })

interface BuildArgs {
  config?: string
}

program.command('build')
  .option('-c, --config <config>', 'Path to config file')
  .action(async ({ config: configPath }: BuildArgs) => {
    const config = await loadConfig({
      path: configPath,
    })
    const instance = new Kopflos(config, {
      plugins: await loadPlugins(config.plugins),
    })

    log.info('Running build actions...')
    const buildActions = instance.plugins.map(plugin => plugin.build?.(instance))
    if (buildActions.length === 0) {
      return log.warn('No plugins with build actions found')
    } else {
      await Promise.all(buildActions)
    }
  })

program.parse(process.argv)
