import 'ulog'
import express from 'express'
import { program } from 'commander'
import type { CosmiconfigResult } from 'cosmiconfig'
import { cosmiconfig } from 'cosmiconfig'
import kopflos from '@kopflos-cms/express'
import { log } from '@kopflos-cms/core'

const explorer = cosmiconfig('kopflos')

program.name('kopflos')

program.command('serve')
  .description('Start the server')
  .option('--base-iri <baseIri>', 'Base IRI for the server and its resources')
  .option('-c, --config <config>', 'Path to config file')
  .option('-p, --port <port>', 'Port to listen on (default: 1429)', parseInt)
  .option('-h, --host <host>', 'Host to bind to (default: "0.0.0.0")')
  .option('--trust-proxy [proxy]', 'Trust the X-Forwarded-Host header')
  .action(async ({ config, port = 1429, host = '0.0.0.0', trustProxy, ...options }) => {
    let ccResult: CosmiconfigResult
    if (config) {
      ccResult = await explorer.load(config)
    } else {
      ccResult = await explorer.search(config)
    }

    const finalOptions = {
      port,
      host,
      ...ccResult?.config || {},
      ...options,
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

program.parse(process.argv)
