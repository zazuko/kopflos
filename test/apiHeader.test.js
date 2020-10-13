const { describe, it } = require('mocha')
const express = require('express')
const request = require('supertest')
const $rdf = require('rdf-ext')
const absoluteUrl = require('absolute-url')
const setLink = require('set-link')
const rdfHandler = require('@rdfjs/express-handler')
const apiHeader = require('../lib/middleware/apiHeader')

function createApp () {
  const app = express()
  app.use(absoluteUrl())
  app.use(setLink)
  app.use(rdfHandler())
  return app
}

describe('middleware/apiHeader', () => {
  it('returns a response when api handler fails', async () => {
    const app = createApp()

    app.use(apiHeader({
      path: '/api',
      dataset: $rdf.dataset()
    }))

    const response = request(app)
      .get('/api')
      .set('accept', 'text/html')

    await response.expect(406)
  })
})
