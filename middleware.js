import path from 'node:path'
import rdf from '@zazuko/env-node'
import { Router } from 'express'
import { middleware as absoluteUrl } from 'absolute-url'
import { asyncMiddleware } from 'middleware-async'
import { defer } from 'promise-the-world'
import rdfHandler from '@rdfjs/express-handler'
import setLink from 'set-link'
import apiHeader from './lib/middleware/apiHeader.js'
import iriTemplate from './lib/middleware/iriTemplate.js'
import operation from './lib/middleware/operation.js'
import resource from './lib/middleware/resource.js'
import waitFor from './lib/middleware/waitFor.js'
import StoreResourceLoader from './StoreResourceLoader.js'
import log from './lib/log.js'

const { debug } = log('middleware')

function middleware(api, { baseIriFromRequest, loader, store, middleware = {} } = {}) {
  const init = defer()
  const router = new Router()

  router.use(absoluteUrl())
  router.use(setLink)
  router.use(asyncMiddleware(async (req, res, next) => {
    const iri = new URL(req.absoluteUrl())

    iri.search = ''

    const term = rdf.namedNode(iri.toString())

    debug(`${req.method} to ${term.value}`)

    req.hydra = {
      api,
      store,
      term,
    }

    if (!api.term) {
      const apiIri = new URL(path.join(req.baseUrl, api.path), iri)

      api.term = rdf.namedNode(apiIri.toString())

      debug(`api.term was not set. Will use: ${api.term.value}`)
    }

    try {
      await api.init()

      init.resolve()

      next()
    } catch (err) {
      init.reject(err)

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
    router.use(resource({ loader: new StoreResourceLoader({ store }) }))
  } else {
    throw new Error('no loader or store provided')
  }

  router.use(operation(middleware))

  return router
}

export default middleware
