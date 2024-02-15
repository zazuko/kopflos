import express from 'express'
import FlatMultiFileStore from 'rdf-store-fs/FlatMultiFileStore.js'
import hydraBox from '../../middleware.js'
import Api from '../../Api.js'
import ResourceStore from './lib/ResourceStore.js'

const __dirname = new URL('.', import.meta.url).pathname

async function main() {
  const store = new FlatMultiFileStore({
    baseIRI: 'http://localhost:9000/',
    path: 'store',
  })

  const api = await Api.fromFile('api.ttl', {
    path: '/api',
    codePath: __dirname,
  })

  const app = express()
  app.locals.store = new ResourceStore({ quadStore: store })
  app.use(hydraBox(api, { store }))
  app.listen(9000)
}

main()
