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

interface DeployResourcesPlugin extends KopflosPlugin {
  deploy(env: KopflosEnvironment, plugins: KopflosPlugin[]): Promise<void>
}

declare module '@kopflos-cms/core' {
  interface Plugins {
    '@kopflos-cms/plugin-deploy-resources': DeployResourcesPlugin
  }

  interface KopflosPlugin {
    deployedResources?(): DatasetCore | Promise<DatasetCore> | Stream | Promise<Stream>
  }
}

const log = createLogger('deploy-resources')

export default class implements DeployResourcesPlugin {
  private readonly instances = new WeakMap<Kopflos, chokidar.FSWatcher>()
  public readonly paths: string[]
  private readonly enabled: boolean
  private readonly watch: boolean

  public readonly name = '@kopflos-cms/plugin-deploy-resources'

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
      const redeploy = async (changedFile: string) => {
        log.info('Resources changed, redeploying')
        log.debug(`Changed path: ${changedFile}`)
        await this.deploy(instance.env, instance.plugins)
        await instance.loadApiGraphs()
      }

      const watcher = chokidar.watch(this.paths, { ignoreInitial: true })
        .on('change', redeploy)
        .on('add', redeploy)
        .on('unlink', redeploy)

      this.instances.set(instance, watcher)
    }

    return this.deploy(instance.env, instance.plugins)
  }

  async deploy(env: KopflosEnvironment, plugins: KopflosPlugin[]) {
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
    }, fromDirectories(this.paths, env.kopflos.config.baseIri))

    await bootstrap({
      dataset,
      store: new ResourcePerGraphStore(env.sparql.default.stream, env),
    })
  }

  async onStop(instance: Kopflos) {
    const watcher = this.instances.get(instance)
    await watcher?.close()
  }
}
