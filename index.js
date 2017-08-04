const fs = require('fs')
const ns = require('./lib/namespaces')
const rdf = require('rdf-ext')
const ApiDocumentation = require('./lib/ApiDocumentation')
const JsonLdParser = require('rdf-parser-jsonld')
const Router = require('express').Router
const TemplatedLink = require('./lib/TemplatedLink')

function middleware (apiPath, api) {
  const router = new Router()

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
      endpointUrl: 'http://ld.stadt-zuerich.ch/query'
    })

    console.log('hydra view route: ' + templatedLink.iriTemplate.template)

    router.use(templatedLink.handle)
  })

  return router
}

function readJsonLdFile (filePath) {
  return rdf.dataset().import(JsonLdParser.import(fs.createReadStream(filePath), {factory: rdf}))
}

middleware.fromJsonLdFile = function (apiPath, filePath) {
  return readJsonLdFile(filePath).then((api) => {
    return middleware(apiPath, api)
  })
}

module.exports = middleware
