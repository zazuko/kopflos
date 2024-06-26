import assert from 'node:assert'
import path from 'node:path'
import express from 'express'
import RDF from '@zazuko/env-node'
import sinon from 'sinon'
import request from 'supertest'
import middleware from '../lib/middleware/operation.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const NS = RDF.namespace('http://example.com/')

describe('middleware/operation', () => {
  let api

  beforeEach(async () => {
    api = {
      env: RDF,
      dataset: await RDF.dataset().import(RDF.fromFile(path.resolve(__dirname, 'support/operationTestCases.ttl'))),
      term: NS.api,
      loaderRegistry: {
        load: sinon.stub(),
      },
    }

    api.loaderRegistry.load
      .returns((req, res) => {
        res.status(200)
        res.end()
      })
  })

  function testResource({ types = [], term, prefetchDataset = RDF.dataset(), property, object, ...rest } = {}) {
    if (property && object) {
      return {
        term,
        types,
        prefetchDataset,
        property,
        object,
        ...rest,
      }
    }

    return {
      term,
      types,
      prefetchDataset,
      ...rest,
    }
  }

  function hydraMock(...resources) {
    return function (req, res, next) {
      req.hydra = {
        api,
        term: RDF.namedNode(req.url),
      }
      res.locals = {
        hydra: {
          resources,
        },
      }
      next()
    }
  }

  it('calls next middleware when no resource was loaded', async () => {
    // given
    const app = express()
    app.use((req, res, next) => {
      req.hydra = {
        api,
      }
      res.locals = {
        hydra: {
          resources: [],
        },
      }
      next()
    })
    app.use(middleware(api))

    // when
    const response = await request(app).get('/')

    // then
    assert.strictEqual(response.status, 404)
  })

  it('calls operations middleware hook when defined', async () => {
    // given
    const app = express()
    app.use(hydraMock(testResource({
      types: [NS.Person],
      term: RDF.namedNode('/'),
    })))
    const hooks = {
      operations: sinon.stub().callsFake((req, res, next) => next()),
    }
    app.use(middleware(hooks))

    // when
    const response = await request(app).get('/')

    // then
    assert(hooks.operations.called)
    assert.strictEqual(response.status, 200)
  })

  it('calls next middleware when class is not supported', async () => {
    // given
    const app = express()
    app.use(hydraMock(testResource({
      types: [NS.NoSuchClass],
    })))
    app.use(middleware())

    // when
    const response = await request(app).get('/')

    // then
    assert.strictEqual(response.status, 405)
  })

  it('returns 405 Method Not Allowed when no operation is found', async () => {
    // given
    const app = express()
    app.use(hydraMock(testResource({
      types: [NS.Person],
    })))
    app.use(middleware())

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
      types: [NS.Person],
      term: RDF.namedNode('/'),
    })))
    app.use(middleware())

    // when
    const response = await request(app).head('/')

    // then
    assert.strictEqual(response.status, 200)
    assert(api.loaderRegistry.load.calledOnceWith(
      sinon.match.hasNested('term.value', sinon.match(/person-get$/)),
      sinon.match.any,
    ))
  })

  it('attaches a getter of clownface pointer wrapping resource dataset', async () => {
    // given
    const app = express()
    let ptr = null
    const dataset = RDF.dataset()
    app.use(hydraMock(testResource({
      types: [NS.Person],
      term: RDF.namedNode('/john-doe'),
      dataset: async () => dataset,
    })))
    app.use(middleware())
    api.loaderRegistry.load.returns(async (req, res) => {
      ptr = await req.hydra.resource.clownface()
      res.end()
    })

    // when
    await request(app).get('/john-doe')

    // then
    assert.notStrictEqual(ptr.term, RDF.namedNode('/john-doe'))
    assert.strictEqual(ptr.dataset, dataset)
  })

  it('calls supported property operation handler when matched to nested resource', async () => {
    // given
    const app = express()
    const dataset = RDF.dataset()
    RDF.clownface({ dataset })
      .namedNode('/john-doe')
      .addOut(NS.friends, RDF.namedNode('/friends'))
    app.use(hydraMock(testResource({
      types: [NS.Person],
      term: RDF.namedNode('/john-doe'),
      property: NS.friends,
      object: RDF.namedNode('/friends'),
      prefetchDataset: dataset,
    })))
    app.use(middleware())

    // when
    const response = await request(app).post('/friends')

    // then
    assert.strictEqual(response.status, 200)
    assert(api.loaderRegistry.load.calledOnceWith(
      sinon.match.hasNested('term.value', sinon.match(/friends-post$/)),
      sinon.match.any,
    ))
  })

  it('returns 405 Method Not Allowed when nested resource does not have operation', async () => {
    // given
    const app = express()
    const dataset = RDF.dataset()
    RDF.clownface({ dataset })
      .namedNode('/john-doe')
      .addOut(NS.friends, RDF.namedNode('/friends'))
    app.use(hydraMock(testResource({
      types: [NS.Person],
      term: RDF.namedNode('/john-doe'),
      property: NS.friends,
      object: RDF.namedNode('/friends'),
      prefetchDataset: dataset,
    })))
    app.use(middleware())

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
      types: [NS.Person],
    })))
    app.use(middleware())

    // when
    const response = await request(app).delete('/foo')

    // then
    assert.strictEqual(response.status, 500)
  })

  it('throws when multiple operations are found for property object', async () => {
    // given
    const app = express()
    const dataset = RDF.dataset()
    RDF.clownface({ dataset })
      .namedNode('/john-doe')
      .addOut(NS.interests, RDF.namedNode('/john-doe/interests'))
    app.use(hydraMock(testResource({
      types: [NS.Person],
      term: RDF.namedNode('/john-doe'),
      property: NS.interests,
      object: RDF.namedNode('/john-doe/interests'),
      prefetchDataset: dataset,
    })))
    app.use(middleware())

    // when
    const response = await request(app).get('/john-doe/interests')

    // then
    assert.strictEqual(response.status, 500)
  })

  it('throws when operation fails to load', async () => {
    // given
    const app = express()
    app.use(hydraMock(testResource({
      types: [NS.Person],
      term: RDF.namedNode('/john-doe'),
    })))
    app.use(middleware())

    // when
    api.loaderRegistry.load.returns(null)
    const response = await request(app).get('/john-doe')

    // then
    assert.strictEqual(response.status, 500)
  })
})
