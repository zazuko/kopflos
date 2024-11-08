import type { Kopflos, KopflosEnvironment } from '@kopflos-cms/core'
import { bootstrap } from '@hydrofoil/talos-core/bootstrap.js'
import { fromDirectories } from '@hydrofoil/talos-core'
import { ResourcePerGraphStore } from '@hydrofoil/resource-store'
import { createLogger } from '@kopflos-cms/logger'

interface Options {
  enabled?: boolean
  paths?: string[]
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

export default function kopflosPlugin({ paths = [], enabled = true }: Options = {}) {
  return {
    onStart({ env }: Kopflos) {
      if (!enabled) {
        log.info('Auto deploy disabled. Skipping deployment')
        return
      }

      if (!paths.length) {
        log.info('No resource paths specified. Skipping deployment')
        return
      }

      log.info(`Auto deploy enabled. Deploying from: ${paths}`)

      return deploy(paths, env)
    },
  }
}
