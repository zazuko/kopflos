const assert = require('assert')
const express = require('express')
const http = require('http')
const { describe, it, beforeEach } = require('mocha')
const sinon = require('sinon')
const request = require('supertest')
const RDF = require('@rdfjs/data-model')
const resource = require('../lib/middleware/resource')

describe('middleware/resource', () => {
  let loader, forClassOperation, forPropertyOperation

  beforeEach(() => {
    forClassOperation = sinon.stub().resolves([])
    forPropertyOperation = sinon.stub().resolves([])

    loader = {
      forClassOperation,
      forPropertyOperation
    }
  })

  function hydraMock (req, res, next) {
    req.hydra = {
      term: RDF.namedNode(req.url)
    }
    res.locals.hydra = {}
    next()
  }

  it('calls next middleware when resource is not found', async () => {
    // given
    const app = express()
    const handler = resource({ loader })
    app.use(hydraMock)
    app.use(handler)

    // when
    const response = await request(app).get('/')

    // then
    assert.strictEqual(response.status, 404)
  })

  it('passes Request object to loader calls', async () => {
    // given
    const app = express()
    const handler = resource({ loader })
    app.use(hydraMock)
    app.use(handler)

    // when
    await request(app).get('/')

    // then
    assert(forClassOperation.calledWith(sinon.match({ termType: 'NamedNode' }), sinon.match.instanceOf(http.IncomingMessage)))
    assert(forPropertyOperation.calledWith(sinon.match({ termType: 'NamedNode' }), sinon.match.instanceOf(http.IncomingMessage)))
  })
})
