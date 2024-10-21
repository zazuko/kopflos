import type { KopflosPlugin } from '@kopflos-cms/core'
import type { Router } from 'express'
import { createLogger } from '@kopflos-cms/logger'

const log = createLogger('express')

type Middleware = string | [string, unknown]

interface Options {
  before?: Array<Middleware>
  after?: Array<Middleware>
}

declare module '@kopflos-cms/core' {
  interface PluginConfig {
    '@kopflos-cms/express/middleware'?: Options
  }
}

export default function ({ before = [], after = [] }: Options): KopflosPlugin {
  function use(middlewares: Array<Middleware>) {
    return async function (host: Router) {
      const promises = middlewares.map(async middleware => {
        let module: string
        let options: unknown | undefined

        if (typeof middleware === 'string') {
          module = middleware
        } else {
          [module, options] = middleware
        }
        log.debug('Loading middleware', module)
        const factory = await import(module)

        host.use(factory.default(options))
      })

      let current = promises.splice(0, 1)
      while (current.length) {
        await Promise.all(current)
        current = promises.splice(0, 1)
      }
    }
  }

  return {
    beforeMiddleware: use(before),
    afterMiddleware: use(after),
  }
}
