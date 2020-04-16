const express = require('express')
const FlatMultiFileStore = require('rdf-store-fs/FlatMultiFileStore')
const hydraBox = require('../../middleware')
const Api = require('../../Api')
const ResourceStore = require('./lib/ResourceStore')

async function main () {
  const store = new FlatMultiFileStore({
    baseIRI: 'http://localhost:9000/',
    path: 'store'
  })

  const api = await Api.fromFile('api.ttl', {
    path: '/api',
    codePath: __dirname
  })

  const app = express()
  app.locals.store = new ResourceStore({ quadStore: store })
  app.use(hydraBox(api, store))
  app.listen(9000)
}

main()
