const absoluteUrl = require('absolute-url')
const fs = require('fs')
const ns = require('./lib/namespaces')
const path = require('path')
const rdf = require('rdf-ext')
const ApiDocumentation = require('./lib/ApiDocumentation')
const JsonLdParser = require('rdf-parser-jsonld')
const JsonLdContextLink = require('./lib/JsonLdContextLink')
const Router = require('express').Router
const TemplatedLink = require('./lib/TemplatedLink')

function middleware (apiPath, api, options) {
  options = options || {}

  const router = new Router()

  router.use(absoluteUrl())
  router.use(JsonLdContextLink.create({
    iri: options.contextHeader
  }))

  const apiDocumentation = new ApiDocumentation({
    api: api,
    iri: apiPath
  })

  router.use(apiDocumentation.handle)

  const templatedLinkIris = api.match(null, ns.rdf.type, ns.hydra.TemplatedLink).toArray().map(t => t.subject)

  templatedLinkIris.forEach((iri) => {
    const templatedLink = new TemplatedLink({
      api: api,
      iri: iri,
      basePath: options.basePath,
      sparqlEndpointUrl: options.sparqlEndpointUrl,
      contextHeader: options.contextHeader,
      debug: options.debug
    })

    if (options.debug) {
      console.log('hydra view route: ' + templatedLink.iriTemplate.template)
    }

    router.use(templatedLink.handle)
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
