import path from 'node:path'
import { RequestHandler, Router } from 'express'
import { middleware as absoluteUrl } from 'absolute-url'
import { asyncMiddleware } from 'middleware-async'
import { defer } from 'promise-the-world'
import rdfHandler from '@rdfjs/express-handler'
import setLink from 'set-link'
import type { DatasetCore, Store } from '@rdfjs/types'
import type { CombinedEnvironment } from '@zazuko/env-core/lib/extend.js'
import apiHeader from './lib/middleware/apiHeader.js'
import iriTemplate from './lib/middleware/iriTemplate.js'
import operation from './lib/middleware/operation.js'
import resource from './lib/middleware/resource.js'
import waitFor from './lib/middleware/waitFor.js'
import StoreResourceLoader from './StoreResourceLoader.js'
import log from './lib/log.js'
import { Api } from './Api.js'
import Factory, { ExtractDataset } from './lib/factory.js'
import { HydraBox, ResourceLoader } from './index.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ValuesArray<R extends Record<string, any>> = R[keyof R][];

export interface AdditionalFactories {
  core: Factory
}

declare module 'express-serve-static-core' {
  interface Request {
    hydra: HydraBox<CombinedEnvironment<ValuesArray<AdditionalFactories>>>
  }
}

const { debug } = log('middleware')

export interface HydraBoxMiddleware {
  resource?: RequestHandler | RequestHandler[] | undefined
  operations?: RequestHandler | RequestHandler[] | undefined
}

interface Options<D extends DatasetCore> {
  baseIriFromRequest?: boolean
  loader?: ResourceLoader<D>
  store?: Store
  middleware?: HydraBoxMiddleware
}

function middleware<E extends Factory = Factory, D extends DatasetCore = ExtractDataset<E>>(api: Api<E>, { baseIriFromRequest, loader, store, middleware = {} }: Options<D>) {
  const init = defer()
  const router = Router()

  router.use(absoluteUrl())
  router.use(setLink)
  router.use(asyncMiddleware(async (req, res, next) => {
    const iri = new URL(req.absoluteUrl())

    iri.search = ''

    const term = api.env.namedNode(iri.toString())

    debug(`${req.method} to ${term.value}`)

    req.hydra = <HydraBox<E>>{
      api,
      store,
      term,
    }

    if (!api.term && api.path) {
      const apiIri = new URL(path.join(req.baseUrl, api.path), iri)

      api.term = api.env.namedNode(apiIri.toString())

      debug(`api.term was not set. Will use: ${api.term.value}`)
    }

    try {
      await api.init()

      init.resolve()

      next()
    } catch (/** @type {unknown} */ err) {
      if (err instanceof Error) {
        init.reject(err)
      }

      next(err)
    }
  }))

  router.use(rdfHandler({ baseIriFromRequest, sendTriples: true }))
  router.use(waitFor(init, () => apiHeader(api)))
  router.use(waitFor(init, () => iriTemplate(api)))

  router.use((req, res, next) => {
    res.locals.hydra = {}
    next()
  })

  if (loader) {
    router.use(resource({ loader }))
  } else if (store) {
    router.use(resource({ loader: new StoreResourceLoader({ store, env: api.env }) }))
  } else {
    throw new Error('no loader or store provided')
  }

  router.use(operation(middleware))

  return router
}

export default middleware
