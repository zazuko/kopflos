import type { RequestHandler } from 'express'
import { Router } from 'express'
import type { KopflosConfig, Query } from '@kopflos-cms/core'
import Kopflos from '@kopflos-cms/core'
import absolutUrl from 'absolute-url'
import rdfHandler from '@rdfjs/express-handler'
import factory from '@zazuko/env-node'
import onetime from 'onetime'
import { match, P } from 'ts-pattern'
import { loadPlugins } from '@kopflos-cms/core/plugins.js' // eslint-disable-line import/no-unresolved
import { BodyWrapper } from './BodyWrapper.js'

declare module 'express-serve-static-core' {
  interface Request {
    iri: string
  }
}

declare module '@kopflos-cms/core' {
  interface KopflosPlugin {
    beforeMiddleware?: (host: Router) => Promise<void> | void
    afterMiddleware?: (host: Router) => Promise<void> | void
  }
}

export default async (options: KopflosConfig): Promise<{ middleware: RequestHandler; instance: Kopflos }> => {
  const kopflos = new Kopflos(options, {
    plugins: await loadPlugins(options.plugins),
  })

  const loadApiGraphs = onetime(() => kopflos.loadApiGraphs())

  const router = Router()

  await Promise.all(kopflos.plugins.map(plugin => plugin.beforeMiddleware?.(router)))

  router
    .use((req, res, next) => {
      loadApiGraphs().then(next).catch(next)
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
    .use(async (req, res, next) => {
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
    })

  await Promise.all(kopflos.plugins.map(plugin => plugin.afterMiddleware?.(router)))

  return {
    middleware: router,
    instance: kopflos,
  }
}
