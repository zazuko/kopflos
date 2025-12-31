import type { Kopflos, KopflosEnvironment, KopflosPlugin } from '@kopflos-cms/core'
import { bootstrap } from '@hydrofoil/talos-core/bootstrap.js'
import { fromDirectories } from '@hydrofoil/talos-core'
import { ResourcePerGraphStore } from '@hydrofoil/resource-store'
import { createLogger } from '@kopflos-cms/logger'
import * as chokidar from 'chokidar'
import type { DatasetCore, Stream } from '@rdfjs/types'

interface Options {
  enabled?: boolean
  paths?: string[]
  watch?: boolean
}

declare module '@kopflos-cms/core' {
  interface PluginConfig {
    '@kopflos-cms/plugin-deploy-resources'?: Options
  }

  interface KopflosPlugin {
    deployedResources?(): DatasetCore | Promise<DatasetCore> | Stream | Promise<Stream>
  }
}

const log = createLogger('deploy-resources')

export async function deploy(paths: string[], env: KopflosEnvironment, plugins: KopflosPlugin[]) {
  const dataset = await plugins.reduce(async (promise, plugin) => {
    if (!plugin.deployedResources) {
      return promise
    }

    const previous = await promise
    const resources = await plugin.deployedResources()
    if ('size' in resources) {
      previous.addAll(resources)
      return previous
    } else {
      return previous.import(resources)
    }
  }, fromDirectories(paths, env.kopflos.config.baseIri))

  await bootstrap({
    dataset,
    store: new ResourcePerGraphStore(env.sparql.default.stream, env),
  })
}

export default class implements KopflosPlugin {
  private readonly instances = new WeakMap<Kopflos, chokidar.FSWatcher>()
  private readonly paths: string[]
  private readonly enabled: boolean
  private readonly watch: boolean

  constructor({ paths = [], enabled = true, watch = true }: Options = {}) {
    this.paths = paths
    this.enabled = enabled
    this.watch = watch
  }

  onStart(instance: Kopflos) {
    if (!this.enabled) {
      log.info('Auto deploy disabled. Skipping deployment')
      return
    }

    if (!this.paths.length) {
      log.info('No resource paths specified. Skipping deployment')
      return
    }

    log.info(`Auto deploy enabled. Deploying from: ${this.paths}`)

    if (this.watch && instance.env.kopflos.config.watch) {
      async function redeploy(paths: string[], changedFile: string) {
        log.info('Resources changed, redeploying')
        log.debug(`Changed path: ${changedFile}`)
        await deploy(paths, instance.env, instance.plugins)
        await instance.loadApiGraphs()
      }

      const watcher = chokidar.watch(this.paths, { ignoreInitial: true })
        .on('change', redeploy.bind(null, this.paths))
        .on('add', redeploy.bind(null, this.paths))
        .on('unlink', redeploy.bind(null, this.paths))

      this.instances.set(instance, watcher)
    }

    return deploy(this.paths, instance.env, instance.plugins)
  }

  async onStop(instance: Kopflos) {
    const watcher = this.instances.get(instance)
    await watcher?.close()
  }
}
