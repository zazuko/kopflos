import type { KopflosEnvironment, KopflosPlugin } from '@kopflos-cms/core'
import { bootstrap } from '@hydrofoil/talos-core/bootstrap.js'
import { fromDirectories } from '@hydrofoil/talos-core'
import { ResourcePerGraphStore } from '@hydrofoil/resource-store'
import type { AnyLogger, BaseLevels } from 'anylogger'
import anylogger from 'anylogger'

interface Options {
  enabled?: boolean
  paths?: string[]
}

const log = (anylogger as unknown as AnyLogger<BaseLevels>)('kopflos:deploy-resources')

export default function kopflosPlugin({ paths = [], enabled = true }: Options = {}): KopflosPlugin {
  return {
    async onStart(env: KopflosEnvironment) {
      if (!enabled) {
        log.info('Auto deploy disabled. Skipping deployment')
        return
      }

      if (!paths.length) {
        log.info('No resource paths specified. Skipping deployment')
        return
      }

      log.info(`Auto deploy enabled. Deploying from: ${paths}`)

      await bootstrap({
        dataset: await fromDirectories(paths, env.kopflos.config.baseIri),
        store: new ResourcePerGraphStore(env.sparql.default.stream, env),
      })
    },
  }
}
