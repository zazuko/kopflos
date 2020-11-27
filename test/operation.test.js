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

  function testResource({ types = [], term, dataset = RDF.dataset(), property, object } = {}) {
    if (property && object) {
      return {
        term,
        types,
        dataset,
        property,
        object
      }
    }

    return {
      term,
      types,
      dataset
    }
  }

  function hydraMock (...resources) {
    return function (req, res, next) {
      req.hydra = {
        term: RDF.namedNode(req.url),
      }
      res.locals = {
        hydra: {
          resources
        }
      }
      next()
    }
  }

  it('calls next middleware when no resource was loaded', async () => {
    // given
    const app = express()
    app.use((req, res, next) => {
      req.hydra = {}
      res.locals = {
        hydra: {
          resources: []
        }
      }
      next()
    })
    app.use(middleware(api))

    // when
    const response = await request(app).get('/')

    // then
    assert.strictEqual(response.status, 404)
  })

  it('calls next middleware when class is not supported', async () => {
    // given
    const app = express()
    app.use(hydraMock(testResource({
      types: [NS.NoSuchClass]
    })))
    app.use(middleware(api))

    // when
    const response = await request(app).get('/')

    // then
    assert.strictEqual(response.status, 405)
  })

  it('returns 405 Method Not Allowed when no operation is found', async () => {
    // given
    const app = express()
    app.use(hydraMock(testResource({
      types: [NS.Person]
    })))
    app.use(middleware(api))

    // when
    const response = await request(app).patch('/')

    // then
    assert.strictEqual(response.status, 405)
    assert.strictEqual(response.headers.allow, 'GET, DELETE')
  })

  it('calls GET handler when HEAD is requested', async () => {
    // given
    const app = express()
    app.use(hydraMock(testResource({
      types: [NS.Person]
    })))
    app.use(middleware(api))

    // when
    const response = await request(app).head('/')

    // then
    assert.strictEqual(response.status, 200)
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
    app.use(hydraMock(testResource({
      types: [NS.Person],
      term: RDF.namedNode('/john-doe'),
      property: NS.friends,
      object: RDF.namedNode('/friends'),
      dataset
    })))
    app.use(middleware(api))

    // when
    const response = await request(app).post('/friends')

    // then
    assert.strictEqual(response.status, 200)
    assert(api.loaderRegistry.load.calledOnceWith(
      sinon.match.hasNested('term.value', sinon.match(/friends-post$/)),
      sinon.match.any
    ))
  })

  it('returns 405 Method Not Allowed when nested resource does not have operation', async () => {
    // given
    const app = express()
    const dataset = RDF.dataset()
    clownface({ dataset })
      .namedNode('/john-doe')
      .addOut(NS.friends, RDF.namedNode('/friends'))
    app.use(hydraMock(testResource({
      types: [NS.Person],
      term: RDF.namedNode('/john-doe'),
      property: NS.friends,
      object: RDF.namedNode('/friends'),
      dataset
    })))
    app.use(middleware(api))

    // when
    const response = await request(app).patch('/friends')

    // then
    assert.strictEqual(response.status, 405)
    assert.strictEqual(response.headers.allow, 'POST')
  })

  it('throws when multiple operations are found for class', async () => {
    // given
    const app = express()
    app.use(hydraMock(testResource({
      types: [NS.Person]
    })))
    app.use(middleware(api))

    // when
    const response = await request(app).delete('/foo')

    // then
    assert.strictEqual(response.status, 500)
  })

  it('throws when multiple operations are found for property object', async () => {
    // given
    const app = express()
    const dataset = RDF.dataset()
    clownface({ dataset })
      .namedNode('/john-doe')
      .addOut(NS.interests, RDF.namedNode('/john-doe/interests'))
    app.use(hydraMock(testResource({
      types: [NS.Person],
      term: RDF.namedNode('/john-doe'),
      property: NS.interests,
      object: RDF.namedNode('/john-doe/interests'),
      dataset
    })))
    app.use(middleware(api))

    // when
    const response = await request(app).get('/john-doe/interests')

    // then
    assert.strictEqual(response.status, 500)
  })

  it('throws when operation fails to load', async () => {
    // given
    const app = express()
    app.use(hydraMock(testResource({
      types: [NS.Person]
    })))
    app.use(middleware(api))

    // when
    api.loaderRegistry.load.returns(null)
    const response = await request(app).get('/john-doe')

    // then
    assert.strictEqual(response.status, 500)
  })
})
