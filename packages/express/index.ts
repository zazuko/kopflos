import type { RequestHandler } from 'express'
import { Router } from 'express'
import type { KopflosConfig, Query } from '@kopflos-cms/core'
import Kopflos from '@kopflos-cms/core'
import absolutUrl from 'absolute-url'
import rdfHandler from '@rdfjs/express-handler'
import factory from '@zazuko/env-node'
import onetime from 'onetime'
import { match, P } from 'ts-pattern'
import asyncMiddleware from 'middleware-async'
import { loadPlugins } from '@kopflos-cms/core/plugins.js' // eslint-disable-line import/no-unresolved
import { BodyWrapper } from './BodyWrapper.js'

declare module 'express-serve-static-core' {
  interface Request {
    iri: string
  }
}

interface MiddlewareHook {
  (host: Router, instance: Kopflos): Promise<void> | void
}

declare module '@kopflos-cms/core' {
  interface KopflosPlugin {
    beforeMiddleware?: MiddlewareHook
    afterMiddleware?: MiddlewareHook
  }
}

export default async (options: KopflosConfig): Promise<{ middleware: RequestHandler; instance: Kopflos }> => {
  const kopflos = new Kopflos(options, {
    plugins: await loadPlugins(options.plugins),
  })

  const loadApiGraphs = onetime(async (graphs: Required<KopflosConfig>['apiGraphs']) => {
    await Kopflos.fromGraphs(kopflos, ...graphs)
  })

  const router = Router()

  await registerMiddlewares(router, kopflos, kopflos.plugins.map(plugin => plugin.beforeMiddleware))

  router
    .use((req, res, next) => {
      if (!options.apiGraphs) {
        return next(new Error('No API graphs configured. In future release it will be possible to select graphs dynamically.'))
      }

      loadApiGraphs(options.apiGraphs).then(next).catch(next)
    })
    .use((req, res, next) => {
      const fullUrl = absolutUrl(req)
      fullUrl.search = ''
      req.iri = fullUrl.toString()
      next()
    })
    .use(rdfHandler({
      factory,
      baseIriFromRequest: (req) => req.iri,
    }))
    .use(asyncMiddleware(async (req, res, next) => {
      const result = await kopflos.handleRequest({
        method: req.method,
        headers: req.headers,
        iri: kopflos.env.namedNode(req.iri),
        body: new BodyWrapper(kopflos.env, kopflos.env.namedNode(req.iri), req),
        query: req.query as unknown as Query,
      })

      if (result.status === 404) {
        return next()
      }

      if (result.status) {
        res.status(result.status)
      }
      res.set(result.headers)
      await match(result.body)
        .with(P.string, body => res.send(body))
        .with(P.nullish, () => res.end())
        .with(P.instanceOf(Error), error => next(error))
        .with({ size: P.number }, (dataset) => res.dataset(dataset))
        .with({ terms: P.array() }, ({ dataset }) => res.dataset(dataset))
        .with({ read: P.any }, stream => res.quadStream(stream))
        .otherwise((stream) => res.send(stream))
    }))

  await registerMiddlewares(router, kopflos, kopflos.plugins.map(plugin => plugin.afterMiddleware))

  return {
    middleware: router,
    instance: kopflos,
  }
}

async function registerMiddlewares(router: Router, kopflos: Kopflos, hooks: Array<MiddlewareHook | undefined>) {
  for (const hook of hooks) {
    await hook?.(router, kopflos)
  }
}
