import type { Kopflos, KopflosEnvironment } from '@kopflos-cms/core'
import { bootstrap } from '@hydrofoil/talos-core/bootstrap.js'
import { fromDirectories } from '@hydrofoil/talos-core'
import { ResourcePerGraphStore } from '@hydrofoil/resource-store'
import { createLogger } from '@kopflos-cms/logger'
import * as chokidar from 'chokidar'

interface Options {
  enabled?: boolean
  paths?: string[]
  watch?: boolean
}

declare module '@kopflos-cms/core' {
  interface PluginConfig {
    '@kopflos-cms/plugin-deploy-resources'?: Options
  }
}

const log = createLogger('deploy-resources')

export async function deploy(paths: string[], env: KopflosEnvironment) {
  await bootstrap({
    dataset: await fromDirectories(paths, env.kopflos.config.baseIri),
    store: new ResourcePerGraphStore(env.sparql.default.stream, env),
  })
}

export default function kopflosPlugin({ paths = [], enabled = true, watch = true }: Options = {}) {
  const instances = new WeakMap<Kopflos, chokidar.FSWatcher>()

  return {
    onStart(instance: Kopflos) {
      if (!enabled) {
        log.info('Auto deploy disabled. Skipping deployment')
        return
      }

      if (!paths.length) {
        log.info('No resource paths specified. Skipping deployment')
        return
      }

      log.info(`Auto deploy enabled. Deploying from: ${paths}`)

      if (watch && instance.env.kopflos.config.watch) {
        const watcher = chokidar.watch(paths).on('change', async (path) => {
          log.info('Resources changed, redeploying')
          log.debug(`Changed path: ${path}`)
          await deploy(paths, instance.env)
          await instance.loadApiGraphs()
        })

        instances.set(instance, watcher)
      }

      return deploy(paths, instance.env)
    },
    async onStop(instance: Kopflos) {
      const watcher = instances.get(instance)
      await watcher?.close()
    },
  }
}
