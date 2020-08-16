const assert = require('assert')
const path = require('path')
const { describe, it, beforeEach } = require('mocha')
const express = require('express')
const RDF = require('@rdfjs/dataset')
const clownface = require('clownface')
const { fromFile } = require('rdf-utils-fs')
const { fromStream } = require('rdf-dataset-ext')
const request = require('supertest')
const sinon = require('sinon')
const namespace = require('@rdfjs/namespace')
const middleware = require('../lib/middleware/operation')

const NS = namespace('http://example.com/')

describe('middleware/operation', () => {
  let api

  beforeEach(async () => {
    api = {
      dataset: await fromStream(RDF.dataset(), fromFile(path.resolve(__dirname, 'support/operationTestCases.ttl'))),
      term: NS.api,
      loaderRegistry: {
        load: sinon.stub()
      }
    }

    api.loaderRegistry.load
      .returns((req, res) => {
        res.status(200)
        res.end()
      })
  })

  function hydraMock(resource, rootResource) {
    return function (req, res, next) {
      req.hydra = {
        term: RDF.namedNode(rootResource || req.url),
        resource,
      }
      next()
    }
  }

  it('calls next middleware when no resource was loaded', async () => {
    // given
    const app = express()
    app.use(hydraMock())
    app.use(middleware(api))

    // when
    const response = await request(app).get('/')

    // then
    assert.strictEqual(response.status,404)
  })

  it('calls next middleware when no operation is found', async () => {
    // given
    const app = express()
    app.use(hydraMock({
      types: [NS.NoSuchClass],
    }))
    app.use(middleware(api))

    // when
    const response = await request(app).get('/')

    // then
    assert.strictEqual(response.status,404)
  })

  it('calls GET handler when HEAD is requested', async () => {
    // given
    const app = express()
    app.use(hydraMock({
      types: [NS.Person],
    }))
    app.use(middleware(api))

    // when
    const response = await request(app).head('/')

    // then
    assert.strictEqual(response.status,200)
    assert(api.loaderRegistry.load.calledOnceWith(
      sinon.match.hasNested('term.value', sinon.match(/person-get$/)),
      sinon.match.any
    ))
  })

  it('calls supported property operation handler when matched to nested resource', async () => {
    // given
    const app = express()
    const dataset = RDF.dataset()
    clownface({ dataset })
      .namedNode('/john-doe')
      .addOut(NS.friends, RDF.namedNode('/friends'))
    app.use(hydraMock({
      types: [NS.Person],
      term: '/friends',
      dataset,
    }, '/john-doe'))
    app.use(middleware(api))

    // when
    const response = await request(app).post('/friends')

    // then
    assert.strictEqual(response.status,200)
    assert(api.loaderRegistry.load.calledOnceWith(
      sinon.match.hasNested('term.value', sinon.match(/friends-post$/)),
      sinon.match.any
    ))
  })
})
