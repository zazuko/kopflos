import { URL } from 'node:url'
import assert from 'node:assert'
import { join } from 'node:path'
import RDF from '@zazuko/env-node'
import express, { Router } from 'express'
import ExpressAsPromise from 'express-as-promise'
import sinon from 'sinon'
import request from 'supertest'
import * as ns from '../lib/namespaces.js'
import Api from '../Api.js'
import hydraBox from '../middleware.js'

const example = RDF.namespace('http://example.org/')

describe('@kopflos-cms/core', () => {
  let api

  beforeEach(() => {
    api = {
      env: RDF,
      path: '/api',
      dataset: RDF.dataset(),
      async init() {},
    }
  })

  it('hooks up resource singular middleware', async () => {
    // given
    const loadedResource = {
      dataset: RDF.dataset(),
      term: RDF.blankNode(),
      types: [],
    }
    const app = express()
    const middleware = sinon.spy((req, res, next) => next())
    app.use(hydraBox(api, {
      loader: {
        forClassOperation: () => [loadedResource],
        forPropertyOperation: () => [],
      },
      middleware: {
        resource: middleware,
      },
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
      types: [],
    }
    const app = express()
    const middlewares = [
      sinon.spy((req, res, next) => next()),
      sinon.spy((req, res, next) => next()),
    ]
    app.use(hydraBox(api, {
      loader: {
        forClassOperation: () => [loadedResource],
        forPropertyOperation: () => [],
      },
      middleware: {
        resource: middlewares,
      },
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
      types: [],
    }
    const app = express()
    const middleware = sinon.stub().callsFake((req, res, next) => {
      next()
    })
    app.use(hydraBox(api, {
      loader: {
        forClassOperation: () => [loadedResource],
        forPropertyOperation: () => [],
      },
      middleware: {
        resource: middleware,
      },
    }))

    // when
    await request(app).get('/')

    // then
    assert(middleware.called)
  })

  describe('api', () => {
    it('should use the path from the given Api object for the link header', async () => {
      await ExpressAsPromise.withServer(async server => {
        const path = '/test/api'
        const containsPath = new RegExp(`<http://[0-9.a-z]*:[0-9]*${path}>; rel="${ns.hydra.apiDocumentation.value}"`)

        server.app.use(hydraBox(new Api({ path, factory: RDF }), {
          loader: {
            forClassOperation: () => [],
            forPropertyOperation: () => [],
          },
        }))

        const url = new URL(await server.listen())
        url.pathname = path

        const res = await RDF.fetch(url)

        assert.match(res.headers.get('link'), containsPath)
      })
    })

    it('should host the Api at the path given in the Api object', async () => {
      await ExpressAsPromise.withServer(async server => {
        const path = '/test/api'
        const dataset = RDF.dataset([
          RDF.quad(example.subject, example.predicate, RDF.literal('test')),
        ])

        server.app.use(hydraBox(new Api({ dataset, path, factory: RDF }), {
          loader: {
            forClassOperation: () => [],
            forPropertyOperation: () => [],
          },
        }))

        const url = new URL(await server.listen())
        url.pathname = path

        const res = await RDF.fetch(url.toString())
        const output = await res.dataset()

        assert.strictEqual(output.toCanonical(), dataset.toCanonical())
      })
    })

    it('should use the path from the given Api object for the link header if it is wrapped in a router', async () => {
      await ExpressAsPromise.withServer(async server => {
        const routerPath = '/router'
        const router = Router()
        const path = '/test/api'
        const containsPath = new RegExp(`<http://[0-9.a-z]*:[0-9]*${join(routerPath, path)}>; rel="${ns.hydra.apiDocumentation.value}"`)

        router.use(hydraBox(new Api({ path, factory: RDF }), {
          loader: {
            forClassOperation: () => [],
            forPropertyOperation: () => [],
          },
        }))

        server.app.use(routerPath, router)

        const url = new URL(await server.listen())
        url.pathname = join(routerPath, path)

        const res = await RDF.fetch(url)

        assert.match(res.headers.get('link'), containsPath)
      })
    })

    it('should host the Api at the path given in the Api object if it is wrapped in a router', async () => {
      await ExpressAsPromise.withServer(async server => {
        const routerPath = '/router'
        const router = Router()
        const path = '/test/api'
        const dataset = RDF.dataset([
          RDF.quad(example.subject, example.predicate, RDF.literal('test')),
        ])

        router.use(hydraBox(new Api({ dataset, path, factory: RDF }), {
          loader: {
            forClassOperation: () => [],
            forPropertyOperation: () => [],
          },
        }))

        server.app.use(routerPath, router)

        const url = new URL(await server.listen())
        url.pathname = join(routerPath, path)

        const res = await RDF.fetch(url.toString())
        const output = await res.dataset()

        assert.strictEqual(output.toCanonical(), dataset.toCanonical())
      })
    })

    it('should host the Api at the path given in the Api object if it is mounde on sub path', async () => {
      await ExpressAsPromise.withServer(async server => {
        const dataset = RDF.dataset([
          RDF.quad(example.subject, example.predicate, RDF.literal('test')),
        ])

        server.app.use('/path/to/app', hydraBox(new Api({ dataset, path: '/api', factory: RDF }), {
          loader: {
            forClassOperation: () => [],
            forPropertyOperation: () => [],
          },
        }))

        const url = new URL(await server.listen())
        url.pathname = '/path/to/app/api'

        const res = await RDF.fetch(url.toString())
        const output = await res.dataset()

        assert.strictEqual(output.toCanonical(), dataset.toCanonical())
      })
    })
  })
})
