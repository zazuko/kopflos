const { describe, it, beforeEach } = require('mocha')
const assert = require('assert')
const express = require('express')
const sinon = require('sinon')
const request = require('supertest')
const RDF = require('@rdfjs/dataset')
const hydraBox = require('../middleware')

describe('hydra-box', () => {
  let api

  beforeEach(() => {
    api = {
      path: '/api',
      dataset: RDF.dataset(),
      async init () {}
    }
  })

  it('hooks up resource singular middleware', async () => {
    // given
    const loadedResource = {
      dataset: RDF.dataset(),
      term: RDF.blankNode(),
      types: []
    }
    const app = express()
    const middleware = sinon.spy((req, res, next) => next())
    app.use(hydraBox(api, {
      loader: {
        forClassOperation: () => [loadedResource]
      },
      middleware: {
        resource: middleware
      }
    }))

    // when
    await request(app).get('/')

    // then
    assert(middleware.calledOnce)
  })

  it('hooks up multiple resource middlewares', async () => {
    // given
    const loadedResource = {
      dataset: RDF.dataset(),
      term: RDF.blankNode(),
      types: []
    }
    const app = express()
    const middlewares = [
      sinon.spy((req, res, next) => next()),
      sinon.spy((req, res, next) => next())
    ]
    app.use(hydraBox(api, {
      loader: {
        forClassOperation: () => [loadedResource]
      },
      middleware: {
        resource: middlewares
      }
    }))

    // when
    await request(app).get('/')

    // then
    middlewares.forEach(middleware => {
      assert(middleware.calledOnce)
    })
  })

  it('calls resource middleware after loader', async () => {
    // given
    let receivedResource
    const loadedResource = {
      dataset: RDF.dataset(),
      term: RDF.blankNode(),
      types: []
    }
    const app = express()
    const middleware = sinon.spy((req, res, next) => {
      receivedResource = req.hydra.resource
      next()
    })
    app.use(hydraBox(api, {
      loader: {
        forClassOperation: () => [loadedResource]
      },
      middleware: {
        resource: middleware
      }
    }))

    // when
    await request(app).get('/')

    // then
    assert.strictEqual(receivedResource, loadedResource)
  })
})
