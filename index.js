const express = require('express')
const fs = require('fs')
const ns = require('./lib/namespaces')
const rdf = require('rdf-ext')
const JsonLdParser = require('rdf-parser-jsonld')
const TemplatedLink = require('./lib/TemplatedLink')

function readJsonLdFile (filePath) {
  return rdf.dataset().import(JsonLdParser.import(fs.createReadStream(filePath), {factory: rdf}))
}

function loadLinks () {
  return readJsonLdFile('examples/zuerich.api.json').then((api) => {
    const templatedLinkIris = api.match(null, ns.rdf.type, ns.hydra.TemplatedLink).toArray().map(t => t.subject)

    return templatedLinkIris.map((iri) => {
      return new TemplatedLink({
        api: api,
        iri: iri,
        endpointUrl: 'http://ld.stadt-zuerich.ch/query'
      })
    })
  })
}

const app = express()

loadLinks().then((links) => {
  links.forEach((link) => {
    console.log('hydra view route: ' + link.iriTemplate.template)

    app.use(link.handle)
  })

  app.listen(9000, () => {
    console.log('listening on http://localhost:9000/')
  })
}).catch((err) => {
  console.error(err.stack)
})
