const absoluteUrl = require('absolute-url')
const jsonldContextLink = require('jsonld-context-link')
const ns = require('./lib/namespaces')
const path = require('path')
const rdfFetch = require('./lib/rdfFetch')
const url = require('url')
const ApiDocumentation = require('./lib/ApiDocumentation')
const BodyParser = require('./lib/BodyParser')
const IriTemplate = require('./lib/IriTemplate')
const Router = require('express').Router
const SparqlView = require('./lib/SparqlView')

function middleware (apiPath, api, options) {
  options = options || {}

  const router = new Router()

  router.use(absoluteUrl())

  router.jsonldContexts = jsonldContextLink({
    basePath: options.contextHeader
  })

  router.use(router.jsonldContexts)

  const apiDocumentation = new ApiDocumentation({
    api: api,
    iri: apiPath
  })

  router.use(apiDocumentation.handle)

  const iriTemplates = api.match(null, ns.rdf.type, ns.hydra.IriTemplate).toArray().map(t => t.subject)

  iriTemplates.forEach((iri) => {
    const iriTemplate = new IriTemplate({
      api: api,
      iri: iri
    })

    if (options.debug) {
      console.log('IriTemplate route: ' + iriTemplate.template)
    }

    router.use(iriTemplate.handle)
  })

  const hydraViews = api.match(null, ns.rdf.type, ns.hydraView.HydraView).toArray().map(t => t.subject)

  return Promise.all(hydraViews.map((iri) => {
    const property = api.match(null, ns.hydra.supportedOperation, iri).toArray().map(t => t.subject).shift()
    const path = url.parse(property.toString()).pathname
    const method = api.match(iri, ns.hydra.method).toArray().map(t => t.object).shift().value.toLowerCase()

    const bodyParser = new BodyParser({
      api: api,
      iri: iri,
      contextHeader: options.contextHeader
    })

    router[method](path, bodyParser.handle)

    const view = new SparqlView({
      api: api,
      iri: iri,
      basePath: options.basePath,
      endpointUrl: options.sparqlEndpointUrl,
      debug: options.debug
    })

    if (options.debug) {
      console.log('HydraView route: (' + method + ') ' + path)
    }

    router[method](path, view.handle)

    return Promise.all([
      bodyParser.init(),
      view.init()
    ])
  })).then(() => {
    return router
  })
}

middleware.fromUrl = function (apiPath, filePath, options) {
  options = options || {}
  options.basePath = options.basePath || path.dirname(filePath)

  return rdfFetch(filePath).then(res => res.dataset()).then((api) => {
    return middleware(apiPath, api, options)
  })
}

// deprecated API
middleware.fromJsonLdFile = middleware.fromUrl

module.exports = middleware
