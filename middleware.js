const debug = require('debug')('hydra-box:middleware')
const absoluteUrl = require('absolute-url')
const { Router } = require('express')
const { defer } = require('promise-the-world')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const rdfHandler = require('@rdfjs/express-handler')
const setLink = require('set-link')
const apiHeader = require('./lib/middleware/apiHeader')
const iriTemplate = require('./lib/middleware/iriTemplate')
const operation = require('./lib/middleware/operation')
const resource = require('./lib/middleware/resource')
const waitFor = require('./lib/middleware/waitFor')

function middleware (api, store, { baseIriFromRequest } = {}) {
  const init = defer()
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

    try {
      await api.init()

      init.resolve()

      next()
    } catch (err) {
      init.reject(err)

      next(err)
    }
  })

  router.use(rdfHandler({ baseIriFromRequest }))
  router.use(waitFor(init, () => apiHeader(api)))
  router.use(waitFor(init, () => iriTemplate(api)))
  router.use(resource(store))
  router.use(waitFor(init, () => operation(api)))

  return router
}

module.exports = middleware
