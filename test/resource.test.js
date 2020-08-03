const { strictEqual } = require('assert')
const express = require('express')
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
      term: RDF.namedNode(req.uri)
    }
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
    strictEqual(response.status, 404)
  })
})
