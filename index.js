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

  const graph = options.graph || api

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

  // search for supported classes and connected views
  const hydraClasses = api.match(null, ns.hydra.supportedClass).toArray().map((classTriple) => {
    return {
      iri: classTriple.object,
      views: api.match(classTriple.object, ns.hydra.supportedOperation).filter((operationTriple) => {
        return api.match(operationTriple.object, ns.rdf.type, ns.hydraView.HydraView).length > 0
      }).toArray().map(t => t.object)
    }
  })

  // search for all views for the types given in graph
  const hydraViews = graph.match(null, ns.rdf.type).toArray().reduce((views, triple) => {
    const hydraClass = hydraClasses.filter(hydraClass => triple.object.equals(hydraClass.iri)).shift()

    if (hydraClass) {
      hydraClass.views.forEach((view) => {
        views.push({
          iri: view,
          path: url.parse(triple.subject.value).path,
          method: api.match(view, ns.hydra.method).toArray().map(t => t.object.value.toLowerCase()).shift()
        })
      })
    }

    return views
  }, [])

  return Promise.all(hydraViews.map((hydraView) => {
    const bodyParser = new BodyParser({
      api: api,
      iri: hydraView.iri,
      contextHeader: options.contextHeader
    })

    router[hydraView.method](hydraView.path, bodyParser.handle)

    const view = new SparqlView({
      api: api,
      iri: hydraView.iri,
      basePath: options.basePath,
      endpointUrl: options.sparqlEndpointUrl,
      debug: options.debug
    })

    if (options.debug) {
      console.log('HydraView route: (' + hydraView.method + ') ' + hydraView.path)
    }

    router[hydraView.method](hydraView.path, view.handle)

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
