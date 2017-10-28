const express = require('express')
const hydraView = require('..')
const path = require('path')

const app = express()

hydraView.fromUrl('/api', 'file://' + path.join(__dirname, 'spaceprobes.api.jsonld'), {
// hydraView.fromUrl('/api', 'http://localhost:8080/spaceprobes.api.jsonld', {
  debug: true,
  sparqlEndpointUrl: 'https://query.wikidata.org/bigdata/namespace/wdq/sparql',
  contextHeader: '/context/'
}).then((middleware) => {
  app.use(middleware)

  app.listen(9000, () => {
    console.log('listening on http://localhost:9000/')
  })
}).catch((err) => {
  console.error(err.stack)
})
