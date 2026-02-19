import { resolve } from 'node:path'
import type { Kopflos, KopflosEnvironment, KopflosPlugin } from '@kopflos-cms/core'
import express from 'express'
import type { InlineConfig, ViteDevServer } from 'vite'
import { createServer, build } from 'vite'
import { createLogger } from '@kopflos-cms/logger'
import { prepareConfig } from './lib/config.js'

export { defineConfig } from 'vite'

export interface BuildConfiguration {
  root: string
  entrypoints: string[]
  outDir?: string
  config?: InlineConfig
}

declare module '@kopflos-cms/core' {
  interface Plugins {
    '@kopflos-cms/vite': DefaultPlugin
  }
}

export abstract class VitePlugin implements KopflosPlugin {
  private readonly log: ReturnType<typeof createLogger>
  private _viteDevServer: WeakMap<BuildConfiguration, ViteDevServer> = new WeakMap()

  protected constructor(public readonly name: string, protected readonly buildConfigurations: Array<BuildConfiguration>) {
    this.log = createLogger(this.name.replace(/^@kopflos-cms\//, ''))
  }

  protected getDefaultPlugin(plugins: readonly KopflosPlugin[]): DefaultPlugin {
    const defaultPlugin = plugins.find(plugin => plugin instanceof DefaultPlugin) as DefaultPlugin | undefined

    if (!defaultPlugin) {
      throw new Error('No default plugin found. Please add @kopflos-cms/vite to your plugins list')
    }

    return defaultPlugin
  }

  protected async getViteDevServer(env: KopflosEnvironment, vitePlugin: DefaultPlugin, options: BuildConfiguration) {
    if (!this._viteDevServer.has(options)) {
      const viteDevServer = await createServer(await this.createConfig(env, vitePlugin, options))
      this._viteDevServer.set(options, viteDevServer)
    }

    return this._viteDevServer.get(options)!
  }

  private createConfig(env: KopflosEnvironment, vitePlugin: DefaultPlugin, options: BuildConfiguration) {
    const root = resolve(env.kopflos.basePath, options.root)
    const outDir = this.resolveOutDir(env, options)
    return prepareConfig({
      entrypoints: options.entrypoints,
      appRoot: env.kopflos.basePath,
      root,
      outDir,
      config: vitePlugin.config || vitePlugin.configPath,
      buildConfig: options.config,
    })
  }

  private resolveOutDir(env: KopflosEnvironment, options: BuildConfiguration) {
    return resolve(env.kopflos.basePath, env.kopflos.buildDir, options.outDir || '')
  }

  async beforeMiddleware(host: express.Router, { env, plugins }: Kopflos) {
    const vitePlugin = this.getDefaultPlugin(plugins)

    for (const options of this.buildConfigurations) {
      if (env.kopflos.config.mode === 'development') {
        this.log.info('Development UI mode. Creating Vite server...')
        const viteDevServer = await this.getViteDevServer(env, vitePlugin, options)
        host.use(viteDevServer.middlewares)
      } else {
        const buildDir = this.resolveOutDir(env, options)
        this.log.info('Serving from build directory')
        this.log.debug('Build directory:', buildDir)
        host.use(express.static(buildDir))
      }
    }
  }

  async build(env: KopflosEnvironment, plugins: readonly KopflosPlugin[]) {
    const vitePlugin = this.getDefaultPlugin(plugins)

    for (const options of this.buildConfigurations) {
      if (!options.entrypoints?.length) {
        this.log.debug('No entrypoints specified. Skipping build')
        return
      }

      this.log.info('Building UI...')
      const config = await this.createConfig(env, vitePlugin, options)
      await build(config)
    }
  }
}

interface DefaultPluginOptions {
  build?: Array<BuildConfiguration> | BuildConfiguration
  configPath?: string
  config?: InlineConfig
}

export default class DefaultPlugin extends VitePlugin {
  public readonly config: InlineConfig | undefined
  public readonly configPath: string | undefined
  public readonly buildConfiguration?: BuildConfiguration

  public constructor({ build = [], config, configPath }: DefaultPluginOptions) {
    if (!Array.isArray(build)) {
      super('@kopflos-cms/vite', [build])
      this.buildConfiguration = build
    } else {
      super('@kopflos-cms/vite', build)
      if (build.length === 1) {
        this.buildConfiguration = build[0]
      }
    }

    this.config = config
    this.configPath = configPath
  }

  protected getDefaultPlugin() {
    return this
  }

  getDefaultViteDevServer(env: KopflosEnvironment) {
    // only work when there is exactly one build configuration
    if (!this.buildConfiguration) {
      throw new Error('No build configuration found. Please add a build configuration to your vite plugin')
    }

    return this.getViteDevServer(env, this, this.buildConfiguration)
  }
}
