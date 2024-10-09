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

export default function (options: Options): KopflosPlugin {
  return {
    async beforeMiddleware(host: express.Router, { env }) {
      if (env.kopflos.config.mode === 'development') {
        log.info('Development UI mode. Creating Vite server...')
        const viteServer = await createViteServer(options)
        host.use(viteServer.middlewares)
      } else {
        host.use('/assets', express.static('dist/assets'))
      }
    },
    async build() {
      log.info('Building UI...')
      await build(await prepareConfig(options))
    },
  }
}
