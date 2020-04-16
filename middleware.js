const debug = require('debug')('hydra-box:middleware')
const absoluteUrl = require('absolute-url')
const { Router } = require('express')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const rdfHandler = require('@rdfjs/express-handler')
const setLink = require('set-link')
const apiHeader = require('./lib/middleware/apiHeader')
const iriTemplate = require('./lib/middleware/iriTemplate')
const operation = require('./lib/middleware/operation')
const resource = require('./lib/middleware/resource')
const StoreResourceLoader = require('./StoreResourceLoader')

function middleware (api, { baseIriFromRequest, loader, store } = {}) {
  const router = new Router()

  router.use(absoluteUrl())
  router.use(setLink)
  router.use(async (req, res, next) => {
    const iri = new URL(req.absoluteUrl())

    iri.search = ''

    const term = rdf.namedNode(iri.toString())

    debug(`${req.method} to ${term.value}`)

    req.hydra = {
      api,
      store,
      term
    }

    if (!api.term) {
      const apiIri = new URL(iri)

      apiIri.pathname = api.path

      api.term = rdf.namedNode(apiIri.toString())

      debug(`api.term was not set. Will use: ${api.term.value}`)
    }

    await api.init()

    next()
  })
  router.use(rdfHandler({ baseIriFromRequest }))
  router.use(apiHeader(api))
  router.use(iriTemplate(api))

  if (loader) {
    router.use(resource({ loader }))
  } else if (store) {
    router.use(resource({ loader: new StoreResourceLoader({ store }) }))
  } else {
    throw new Error('no loader or store provided')
  }

  router.use(operation(api))

  return router
}

module.exports = middleware
