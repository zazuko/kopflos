import { resolve } from 'node:path'
import type { Kopflos, KopflosEnvironment, KopflosPlugin } from '@kopflos-cms/core'
import express from 'express'
import type { InlineConfig, ViteDevServer } from 'vite'
import { createServer, build } from 'vite'
import { createLogger } from '@kopflos-cms/logger'
import { prepareConfig } from './lib/config.js'

export { defineConfig } from 'vite'

export interface Options {
  configPath?: string
  entrypoints?: string[]
}

export interface BuildConfiguration {
  root: string
  outDir?: string
}

declare module '@kopflos-cms/core' {
  interface Plugins {
    '@kopflos-cms/vite': VitePlugin
  }
}

export abstract class VitePlugin implements KopflosPlugin {
  private readonly log: ReturnType<typeof createLogger>
  private _viteDevServer?: ViteDevServer

  protected constructor(public readonly name: string, protected readonly options: Array<BuildConfiguration>) {
    this.log = createLogger(this.name)
  }

  abstract get buildDir(): string

  abstract get rootDir(): string

  async createViteDevServer(env: KopflosEnvironment, options: Options) {
    if (!this._viteDevServer) {
      const root = resolve(env.kopflos.basePath, this.buildDir)
      this._viteDevServer = await createServer(await prepareConfig({ ...options, root }))
    }

    return this._viteDevServer!
  }

  async beforeMiddleware(host: express.Router, { env }: Kopflos) {
    if (env.kopflos.config.mode === 'development') {
      this.log.info('Development UI mode. Creating Vite server...')

      const configPath = this.options.configPath
        ? resolve(env.kopflos.basePath, this.options.configPath)
        : this.options.configPath

      const viteDevServer = await this.createViteDevServer(env, { ...this.options, configPath })
      host.use(viteDevServer.middlewares)
    } else {
      const buildDir = resolve(env.kopflos.basePath, env.kopflos.buildDir, this.buildDir)
      this.log.info('Serving from build directory')
      this.log.debug('Build directory:', buildDir)
      host.use(express.static(buildDir))
    }
  }

  async build(env: KopflosEnvironment) {
    const outDir = resolve(env.kopflos.basePath, env.kopflos.buildDir, this.buildDir)
    const configPath = this.options.configPath
      ? resolve(env.kopflos.basePath, this.options.configPath)
      : this.options.configPath

    if (!this.options.entrypoints?.length) {
      this.log.debug('No entrypoints specified. Skipping build')
      return
    }

    this.log.info('Building UI...')
    await build(await prepareConfig({
      ...this.options,
      root: env.kopflos.basePath,
      outDir,
      configPath,
    }))
  }
}
