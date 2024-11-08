import { resolve } from 'node:path'
import type { Kopflos, KopflosPlugin } from '@kopflos-cms/core'
import express from 'express'
import { build } from 'vite'
import { createViteServer } from './lib/server.js'
import { prepareConfig } from './lib/config.js'
import { log } from './lib/log.js'

export { defineConfig } from 'vite'

export interface Options {
  configPath?: string
  root?: string
  outDir?: string
  entrypoints?: string[]
}

declare module '@kopflos-cms/core' {
  interface PluginConfig {
    '@kopflos-cms/vite'?: Options
  }
}

export default function ({ outDir = 'dist', ...options }: Options): KopflosPlugin {
  const rootDir = resolve(process.cwd(), options.root || '')
  const buildDir = resolve(process.cwd(), outDir)

  return {
    onStart({ env }: Kopflos): Promise<void> | void {
      const viteVars = {
        basePath: env.kopflos.config.mode === 'development' ? rootDir : buildDir,
      }
      log.info('Variables', viteVars)
      env.kopflos.variables.VITE = Object.freeze(viteVars)
    },
    async beforeMiddleware(host: express.Router, { env }) {
      if (env.kopflos.config.mode === 'development') {
        log.info('Development UI mode. Creating Vite server...')
        const viteServer = await createViteServer(options)
        host.use(viteServer.middlewares)
      } else {
        log.info('Serving UI from build directory')
        log.debug('Build directory:', buildDir)
        host.use(express.static(buildDir))
      }
    },
    async build() {
      log.info('Building UI...')
      await build(await prepareConfig({ outDir, ...options }))
    },
  }
}
