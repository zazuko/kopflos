const { describe, it, beforeEach } = require('mocha')
const assert = require('assert')
const { join } = require('path')
const { URL } = require('url')
const express = require('express')
const { withServer } = require('express-as-promise')
const sinon = require('sinon')
const request = require('supertest')
const { toCanonical } = require('rdf-dataset-ext')
const RDF = require('@rdfjs/dataset')
const rdfFetch = require('@rdfjs/fetch')
const namespace = require('@rdfjs/namespace')
const ns = require('../lib/namespaces')
const Api = require('../Api')
const hydraBox = require('../middleware')

ns.example = namespace('http://example.org/')

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
        forClassOperation: () => [loadedResource],
        forPropertyOperation: () => []
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
        forClassOperation: () => [loadedResource],
        forPropertyOperation: () => []
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
    const loadedResource = {
      dataset: RDF.dataset(),
      term: RDF.blankNode(),
      types: []
    }
    const app = express()
    const middleware = sinon.stub().callsFake((req, res, next) => {
      next()
    })
    app.use(hydraBox(api, {
      loader: {
        forClassOperation: () => [loadedResource],
        forPropertyOperation: () => []
      },
      middleware: {
        resource: middleware
      }
    }))

    // when
    await request(app).get('/')

    // then
    assert(middleware.called)
  })

  describe('api', () => {
    it('should use the path from the given Api object for the link header', async () => {
      await withServer(async server => {
        const path = '/test/api'
        const containsPath = new RegExp(`<http://[0-9.a-z]*:[0-9]*${path}>; rel="${ns.hydra.apiDocumentation.value}"`)

        server.app.use(hydraBox(new Api({ path }), {
          loader: {
            forClassOperation: () => [],
            forPropertyOperation: () => []
          }
        }))

        const url = new URL(await server.listen())
        url.pathname = path

        const res = await rdfFetch(url)

        assert.match(res.headers.get('link'), containsPath)
      })
    })

    it('should host the Api at the path given in the Api object', async () => {
      await withServer(async server => {
        const path = '/test/api'
        const dataset = RDF.dataset([
          RDF.quad(ns.example.subject, ns.example.predicate, RDF.literal('test'))
        ])

        server.app.use(hydraBox(new Api({ dataset, path }), {
          loader: {
            forClassOperation: () => [],
            forPropertyOperation: () => []
          }
        }))

        const url = new URL(await server.listen())
        url.pathname = path

        const res = await rdfFetch(url.toString())
        const output = await res.dataset()

        assert.strictEqual(toCanonical(output), toCanonical(dataset))
      })
    })

    it('should use the path from the given Api object for the link header if it is wrapped in a router', async () => {
      await withServer(async server => {
        const routerPath = '/router'
        const router = new express.Router()
        const path = '/test/api'
        const containsPath = new RegExp(`<http://[0-9.a-z]*:[0-9]*${join(routerPath, path)}>; rel="${ns.hydra.apiDocumentation.value}"`)

        router.use(hydraBox(new Api({ path }), {
          loader: {
            forClassOperation: () => [],
            forPropertyOperation: () => []
          }
        }))

        server.app.use(routerPath, router)

        const url = new URL(await server.listen())
        url.pathname = join(routerPath, path)

        const res = await rdfFetch(url)

        assert.match(res.headers.get('link'), containsPath)
      })
    })

    it('should host the Api at the path given in the Api object if it is wrapped in a router', async () => {
      await withServer(async server => {
        const routerPath = '/router'
        const router = new express.Router()
        const path = '/test/api'
        const dataset = RDF.dataset([
          RDF.quad(ns.example.subject, ns.example.predicate, RDF.literal('test'))
        ])

        router.use(hydraBox(new Api({ dataset, path }), {
          loader: {
            forClassOperation: () => [],
            forPropertyOperation: () => []
          }
        }))

        server.app.use(routerPath, router)

        const url = new URL(await server.listen())
        url.pathname = join(routerPath, path)

        const res = await rdfFetch(url.toString())
        const output = await res.dataset()

        assert.strictEqual(toCanonical(output), toCanonical(dataset))
      })
    })
  })
})
