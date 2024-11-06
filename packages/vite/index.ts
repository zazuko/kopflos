import { resolve } from 'node:path'
import type { KopflosPlugin } from '@kopflos-cms/core'
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
  return {
    async beforeMiddleware(host: express.Router, { env }) {
      if (env.kopflos.config.mode === 'development') {
        log.info('Development UI mode. Creating Vite server...')
        const viteServer = await createViteServer(options)
        host.use(viteServer.middlewares)
      } else {
        log.info('Serving UI from build directory')
        const buildDir = resolve(process.cwd(), outDir)
        log.debug('Build directory:', buildDir)
        host.use('/assets', express.static(resolve(buildDir, 'assets')))
      }
    },
    async build() {
      log.info('Building UI...')
      await build(await prepareConfig({ outDir, ...options }))
    },
  }
}
