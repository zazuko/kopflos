import 'ulog'
import express from 'express'
import { program } from 'commander'
import type { CosmiconfigResult } from 'cosmiconfig'
import { cosmiconfig } from 'cosmiconfig'
import kopflos from '@kopflos-cms/express'
import { log } from '@kopflos-cms/core'
import { ResourcePerGraphStore } from '@hydrofoil/resource-store'
import { bootstrap } from '@hydrofoil/talos-core/bootstrap.js'
import { fromDirectories } from '@hydrofoil/talos-core'

const explorer = cosmiconfig('kopflos')

program.name('kopflos')

program.command('serve')
  .description('Start the server')
  .option('--base-iri <baseIri>', 'Base IRI for the server and its resources')
  .option('-c, --config <config>', 'Path to config file')
  .option('-p, --port <port>', 'Port to listen on (default: 1429)', parseInt)
  .option('-h, --host <host>', 'Host to bind to (default: "0.0.0.0")')
  .option('--deploy <paths...>', 'Resource paths to be deployed')
  .option('--auto-deploy', 'Deploy resources from the resources directory (default: true)')
  .option('--no-auto-deploy', 'Disable auto deployment')
  .action(async ({ config, port, host, ...options }) => {
    let ccResult: CosmiconfigResult
    if (config) {
      ccResult = await explorer.load(config)
    } else {
      ccResult = await explorer.search(config)
    }

    const finalOptions = {
      port: 1429,
      host: '0.0.0.0',
      autoDeploy: true,
      ...ccResult?.config || {},
      ...options,
    }

    const app = express()

    const { instance, middleware } = kopflos(finalOptions)
    app.use(middleware)

    if (finalOptions.autoDeploy) {
      if (finalOptions.deploy?.length) {
        log.info(`Auto deploy enabled. Deploying from: ${finalOptions.deploy}`)

        const publicBaseIri = finalOptions.baseIri
        await bootstrap({
          dataset: await fromDirectories(finalOptions.deploy, publicBaseIri),
          store: new ResourcePerGraphStore(instance.env.sparql.default.stream, instance.env),
        })
      } else {
        log.info('No resource paths specified. Skipping deployment')
      }
    } else {
      log.info('Auto deploy disabled. Skipping deployment')
    }

    app.listen(port, host, () => {
      log.info(`Server running on ${port}. API URL: ${finalOptions.baseIri}`)
    })
  })

program.parse(process.argv)
