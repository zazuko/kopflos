const { debug } = require('./lib/log')('middleware')
const absoluteUrl = require('absolute-url')
const { Router } = require('express')
const { asyncMiddleware } = require('middleware-async')
const { defer } = require('promise-the-world')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const rdfHandler = require('@rdfjs/express-handler')
const setLink = require('set-link')
const apiHeader = require('./lib/middleware/apiHeader')
const iriTemplate = require('./lib/middleware/iriTemplate')
const operation = require('./lib/middleware/operation')
const resource = require('./lib/middleware/resource')
const waitFor = require('./lib/middleware/waitFor')
const StoreResourceLoader = require('./StoreResourceLoader')

function middleware (api, { baseIriFromRequest, store, middleware = {}, ...options} = {} = {}) {
  const init = defer()
  const router = new Router()

  router.use(absoluteUrl())
  router.use(setLink)
  router.use(asyncMiddleware(async (req, res, next) => {
    const iri = new URL(req.absoluteUrl())

    iri.search = ''

    const term = rdf.namedNode(iri.toString())

    debug(`${req.method} to ${term.value}`)

    let loader
    if (options.loader) {
      loader = options.loader
    } else if (store) {
      loader = new StoreResourceLoader({ store })
    } else {
      throw new Error('no loader or store provided')
    }

    req.hydra = {
      api,
      store,
      term,
      loader
    }

    if (!api.term) {
      const apiIri = new URL(iri)

      apiIri.pathname = api.path

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
  router.use(resource())

  if (middleware.resource) {
    router.use(waitFor(init, () => middleware.resource))
  }
  router.use(waitFor(init, () => operation(api)))

  return router
}

module.exports = middleware
