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
const createRegistry = require('./lib/loaders')
const cf = require('clownface')
const SparqlHttp = require('sparql-http-client')

function middleware (apiPath, api, options) {
  options = options || {}

  const loaders = createRegistry(options)
  const graph = options.graph || api

  const client = new SparqlHttp({
    endpointUrl: options.sparqlEndpointQueryUrl || options.sparqlEndpointUrl,
    updateUrl: options.sparqlEndpointUpdateUrl,
    fetch: rdfFetch
  })

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

  // search for supported classes and supported properties connected views
  const hydraClasses = api.match(null, ns.hydra.supportedClass).toArray().map((classTriple) => {
    return {
      iri: classTriple.object,
      views: api.match(classTriple.object, ns.hydra.supportedOperation).filter((operationTriple) => {
        return api.match(operationTriple.object, ns.rdf.type, ns.hydraBox.View).length > 0
      }).toArray().map(t => t.object),
      properties: api.match(classTriple.object, ns.hydra.supportedProperty).toArray().map((supportedPropertyTriple) => {
        const propertyTriple = api.match(supportedPropertyTriple.object, ns.hydra.property).toArray().shift()

        return {
          iri: propertyTriple.object,
          views: api.match(propertyTriple.object, ns.hydra.supportedOperation).filter((operationTriple) => {
            return api.match(operationTriple.object, ns.rdf.type, ns.hydraBox.View).length > 0
          }).toArray().map(t => t.object)
        }
      })
    }
  })

  // search for all views for the types given in graph
  const hydraViews = graph.match(null, ns.rdf.type).toArray().reduce((views, triple) => {
    const hydraClass = hydraClasses.filter(hydraClass => triple.object.equals(hydraClass.iri)).shift()

    if (hydraClass) {
      // views directly connected to classes
      hydraClass.views.forEach((view) => {
        views.push({
          iri: view,
          path: url.parse(triple.subject.value).path,
          method: api.match(view, ns.hydra.method).toArray().map(t => t.object.value.toLowerCase()).shift()
        })
      })

      // views connected to properties
      hydraClass.properties.forEach((hydraProperty) => {
        graph.match(triple.subject, hydraProperty.iri).forEach((property) => {
          hydraProperty.views.forEach((view) => {
            views.push({
              iri: view,
              path: url.parse(property.object.value).path,
              method: api.match(view, ns.hydra.method).toArray().map(t => t.object.value.toLowerCase()).shift(),
              implementation: cf(api).node(view).out(ns.code.implementedBy)
            })
          })
        })
      })
    }

    return views
  }, []).filter(view => {
    if (!view.implementation) {
      if (options.debug) {
        console.warn(`No implementation for operation ${view.path}`)
      }
      return false
    }

    return true
  })

  return Promise.all(hydraViews.map(async (hydraView) => {
    const bodyParser = new BodyParser({
      api: api,
      iri: hydraView.iri,
      contextHeader: options.contextHeader
    })

    router[hydraView.method](hydraView.path, bodyParser.handle)

    const handler = await loaders.load(
      hydraView.implementation,
      {
        hydraView, options, client
      })

    router[hydraView.method](hydraView.path, handler)

    await bodyParser.init()
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
