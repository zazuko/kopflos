import { resolve } from 'node:path'
import type { Kopflos, KopflosEnvironment, KopflosPlugin, KopflosPluginConstructor } from '@kopflos-cms/core'
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

export default function ({ outDir = 'dist', ...options }: Options): KopflosPluginConstructor<VitePlugin> {
  const rootDir = resolve(process.cwd(), options.root || '')
  const buildDir = resolve(process.cwd(), outDir)

  return class implements VitePlugin {
    public readonly name = '@kopflos-cms/vite'

    private env: KopflosEnvironment
    private _viteDevServer?: ViteDevServer

    get viteDevServer(): ViteDevServer | undefined {
      return this._viteDevServer
    }

    constructor(instance: Kopflos) {
      this.env = instance.env
    }

    onStart(): Promise<void> | void {
      const viteVars = {
        basePath: this.env.kopflos.config.mode === 'development' ? rootDir : buildDir,
      }
      log.info('Variables', viteVars)
      this.env.kopflos.variables.VITE = Object.freeze(viteVars)
    }

    async beforeMiddleware(host: express.Router) {
      if (this.env.kopflos.config.mode === 'development') {
        log.info('Development UI mode. Creating Vite server...')

        this._viteDevServer = await createViteServer(options)
        host.use(this._viteDevServer.middlewares)
      } else {
        log.info('Serving UI from build directory')
        log.debug('Build directory:', buildDir)
        host.use(express.static(buildDir))
      }
    }

    static async build() {
      log.info('Building UI...')
      await build(await prepareConfig({ outDir, ...options }))
    }
  }
}
