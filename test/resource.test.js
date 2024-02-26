import { strictEqual } from 'node:assert'
import request from 'supertest'
import RDF from '@zazuko/env-node'
import sinon from 'sinon'
import express from 'express'
import resource from '../lib/middleware/resource.js'

describe('middleware/resource', () => {
  let loader, forClassOperation, forPropertyOperation

  beforeEach(() => {
    forClassOperation = sinon.stub().resolves([])
    forPropertyOperation = sinon.stub().resolves([])

    loader = {
      forClassOperation,
      forPropertyOperation,
    }
  })

  function hydraMock(req, res, next) {
    req.hydra = {
      term: RDF.namedNode(req.url),
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
    strictEqual(response.status, 404)
  })
})
