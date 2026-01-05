import { resolve } from 'node:path'
import type { Kopflos, KopflosEnvironment, KopflosPlugin } from '@kopflos-cms/core'
import express from 'express'
import type { InlineConfig, ViteDevServer } from 'vite'
import { build } from 'vite'
import { createViteServer } from './lib/server.js'
import { prepareConfig } from './lib/config.js'
import { log } from './lib/log.js'

export { defineConfig } from 'vite'

export interface Options {
  configPath?: string
  config?: InlineConfig
  root?: string
  outDir?: string
  entrypoints?: string[]
}

interface VitePlugin extends KopflosPlugin {
  viteDevServer?: ViteDevServer
}

declare module '@kopflos-cms/core' {
  interface PluginConfig {
    '@kopflos-cms/vite'?: Options
  }

  interface Plugins {
    '@kopflos-cms/vite': VitePlugin
  }
}

export default class implements VitePlugin {
  public readonly name = '@kopflos-cms/vite'
  private readonly rootDir: string
  private readonly buildDir: string
  private readonly outDir: string

  private _viteDevServer?: ViteDevServer

  constructor(private readonly options: Options) {
    this.outDir = options.outDir || 'dist'
    this.rootDir = options.root || ''
    this.buildDir = this.outDir
  }

  get viteDevServer(): ViteDevServer | undefined {
    return this._viteDevServer
  }

  onStart({ env }: Kopflos): Promise<void> | void {
    const viteVars = {
      basePath: resolve(env.kopflos.config.basePath, env.kopflos.config.mode === 'development' ? this.rootDir : this.buildDir),
    }
    log.info('Variables', viteVars)
    env.kopflos.variables.VITE = Object.freeze(viteVars)
  }

  async beforeMiddleware(host: express.Router, { env }: Kopflos) {
    if (env.kopflos.config.mode === 'development') {
      log.info('Development UI mode. Creating Vite server...')

      const configPath = this.options.configPath
        ? resolve(env.kopflos.config.basePath, this.options.configPath)
        : this.options.configPath
      this._viteDevServer = await createViteServer({
        configPath,
        ...this.options,
      })
      host.use(this._viteDevServer.middlewares)
    } else {
      const buildDir = resolve(env.kopflos.config.basePath, this.buildDir)
      log.info('Serving UI from build directory')
      log.debug('Build directory:', buildDir)
      host.use(express.static(buildDir))
    }
  }

  async build(env: KopflosEnvironment) {
    log.info('Building UI...')
    const outDir = resolve(env.kopflos.config.basePath, this.outDir)
    const configPath = this.options.configPath
      ? resolve(env.kopflos.config.basePath, this.options.configPath)
      : this.options.configPath
    await build(await prepareConfig({
      outDir,
      configPath,
      ...this.options,
    }))
  }
}
