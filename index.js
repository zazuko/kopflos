const express = require('express')
const fs = require('fs')
const ns = require('./lib/namespaces')
const rdf = require('rdf-ext')
const JsonLdParser = require('rdf-parser-jsonld')
const SparqlView = require('./lib/SparqlView')

function readJsonLdFile (filePath) {
  return rdf.dataset().import(JsonLdParser.import(fs.createReadStream(filePath), {factory: rdf}))
}

function loadViews () {
  return readJsonLdFile('examples/zuerich.api.json').then((api) => {
    const viewIris = api.match(null, ns.rdf.type, ns.hydraView.HydraView).toArray().map(t => t.subject)

    return viewIris.map((iri) => {
      return new SparqlView({
        api: api,
        iri: iri,
        endpointUrl: 'http://ld.stadt-zuerich.ch/query'
      })
    })
  })
}

const app = express()

loadViews().then((views) => {
  views.forEach((view) => {
    app.use(view.handle)
  })

  app.listen(9000, () => {
    console.log('listening on http://localhost:9000/')
  })
}).catch((err) => {
  console.error(err.stack)
})
