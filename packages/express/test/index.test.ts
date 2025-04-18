import * as url from 'node:url'
import type { Express } from 'express'
import express from 'express'
import request from 'supertest'
import { createStore } from 'mocha-chai-rdf/store.js'
import snapshots from 'mocha-chai-rdf/snapshots.js'
import { expect, use } from 'chai'
import { ntriples, turtle } from '@tpluscode/rdf-string'
import rdf from '@zazuko/env-node'
import { ex } from '../../testing-helpers/ns.js'
import kopflos from '../index.js'
import inMemoryClients from '../../testing-helpers/in-memory-clients.js'

describe('@kopflos-cms/express', function () {
  use(snapshots)

  let app: Express

  beforeEach(createStore(import.meta.url, { format: 'trig', loadAll: true, sliceTestPath: [2, -1] }))

  describe('configured api graphs', function () {
    beforeEach(async function () {
      const { middleware } = await kopflos({
        baseIri: 'http://example.org/',
        codeBase: url.fileURLToPath(new URL('.', import.meta.url)),
        sparql: {
          default: inMemoryClients(this.rdf),
        },
        apiGraphs: [ex.api],
      })

      app = express()
        .set('trust proxy', true)
        .use(middleware)
    })

    it('should call next when no resource shape is found', async function () {
      app.use((req, res) => {
        res.send('not found')
      })

      await request(app)
        .get('/not-found')
        .expect(200, 'not found')
    })

    it('must not stall after first request', async function () {
      await request(app)
        .get('/not-found')
        .expect(404)

      await request(app)
        .get('/not-found')
        .expect(404)
    })

    context('request to resource without explicit handler', function () {
      it('should should return Core representation', async function () {
        const response = await request(app)
          .get('/no-handler')
          .set('host', 'example.org')
          .expect(200)

        expect(response.body).toMatchSnapshot()
      })

      for (const method of ['post', 'put'] as const) {
        it('should should return 405 to ' + method.toUpperCase(), async function () {
          await request(app)[method]('/no-handler')
            .set('host', 'example.org')
            .expect(405)
        })
      }

      it('should support content negotiation', async function () {
        const response = await request(app)
          .get('/no-handler')
          .set('host', 'example.org')
          .set('accept', 'text/turtle')
          .expect('Content-Type', /text\/turtle/)
          .expect(200)

        expect(response.text).toMatchSnapshot()
      })
    })

    it('should respond to HEAD requests', async function () {
      const response = await request(app)
        .head('/no-handler')
        .set('host', 'example.org')
        .expect(200)

      expect(response.body).to.be.empty
    })

    context('request to resource with GET handler', function () {
      it('should should return Core representation', async function () {
        const response = await request(app)
          .get('/with-handler')
          .set('host', 'example.org')
          .expect(200)

        expect(response.body).toMatchSnapshot()
      })

      it('should respond to HEAD requests', async function () {
        const response = await request(app)
          .head('/with-handler')
          .set('host', 'example.org')
          .expect(200)

        expect(response.body).to.be.empty
      })

      it('should support content negotiation', async function () {
        const response = await request(app)
          .get('/with-handler')
          .set('host', 'example.org')
          .set('accept', 'text/turtle')
          .expect('Content-Type', /text\/turtle/)
          .expect(200)

        expect(response.text).toMatchSnapshot()
      })

      it('should forward response headers', async function () {
        await request(app)
          .head('/with-handler')
          .set('host', 'example.org')
          .expect(200)
          .expect('x-handler', 'get-with-handler.js')
      })
    })

    context('request with body', function () {
      it('should be undefined on GET requests', async function () {
        const { body } = await request(app)
          .get('/body-handler')
          .send(turtle`<> a ${ex.Foo} .`.toString())
          .set('host', 'example.org')
          .set('accept', 'application/n-triples')
          .expect(200)

        expect(body).to.be.empty
      })

      for (const type of ['stream', 'dataset', 'pointer']) {
        it(`body can be accessed as ${type}`, async function () {
          const response = await request(app)
            .post('/body-handler')
            .query({ type })
            .set('content-type', 'text/turtle')
            .send(turtle`<> a ${ex.Foo} .`.toString())
            .set('host', 'example.org')
            .set('accept', 'application/n-triples')
            .expect(200)

          expect(response.text).to.eq(ntriples`<http://example.org/body-handler> ${rdf.ns.rdf.type} ${ex.Foo} .\n`.toString())
        })
      }

      it('can parse body directly', async function () {
        const { body } = await request(app)
          .get('/body-handler')
          .query({ type: 'json' })
          .send({ foo: 'baz' })
          .set('content-type', 'application/json')
          .set('host', 'example.org')
          .expect(200)

        expect(body).to.deep.eq({
          bar: 'baz',
        })
      })
    })
  })

  describe('automatic API graph', function () {
    beforeEach(async function () {
      const { middleware } = await kopflos({
        baseIri: 'http://example.org/',
        codeBase: url.fileURLToPath(new URL('.', import.meta.url)),
        sparql: {
          default: inMemoryClients(this.rdf),
        },
      })

      app = express()
        .set('trust proxy', true)
        .use(middleware)
    })

    it('throws an error when no API graphs are configured', async function () {
      await request(app)
        .get('/')
        .expect(500, /No API graphs configured/)
    })
  })
})
