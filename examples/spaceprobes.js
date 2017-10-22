const express = require('express')
const hydraView = require('..')

const app = express()

hydraView.fromJsonLdFile('/api', 'spaceprobes.api.json', {
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
