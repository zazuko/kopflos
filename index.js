const absoluteUrl = require('absolute-url')
const fs = require('fs')
const jsonldContextLink = require('jsonld-context-link')
const ns = require('./lib/namespaces')
const path = require('path')
const rdf = require('rdf-ext')
const url = require('url')
const ApiDocumentation = require('./lib/ApiDocumentation')
const IriTemplate = require('./lib/IriTemplate')
const JsonLdParser = require('rdf-parser-jsonld')
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

  hydraViews.forEach((iri) => {
    const property = api.match(null, ns.hydra.supportedOperation, iri).toArray().map(t => t.subject).shift()
    const path = url.parse(property.toString()).pathname

    const view = new SparqlView({
      api: api,
      iri: iri,
      basePath: options.basePath,
      endpointUrl: options.sparqlEndpointUrl,
      contextHeader: options.contextHeader,
      debug: options.debug
    })

    if (options.debug) {
      console.log('HydraView route: ' + path)
    }

    router.use(path, view.handle)
  })

  return router
}

function readJsonLdFile (filePath) {
  return rdf.dataset().import(JsonLdParser.import(fs.createReadStream(filePath), {factory: rdf}))
}

middleware.fromJsonLdFile = function (apiPath, filePath, options) {
  options = options || {}
  options.basePath = options.basePath || path.dirname(filePath)

  return readJsonLdFile(filePath).then((api) => {
    return middleware(apiPath, api, options)
  }).then((middleware) => {
    return middleware
  })
}

module.exports = middleware
