import * as url from 'node:url'
import type { Express } from 'express'
import express from 'express'
import request from 'supertest'
import { createStore } from 'mocha-chai-rdf/store.js'
import 'mocha-chai-rdf/snapshots.js'
import { expect } from 'chai'
import { ex } from '../../testing-helpers/ns.js'
import kopflos from '../index.js'
import inMemoryClients from '../../testing-helpers/in-memory-clients.js'

describe('@kopflos-cms/express', () => {
  let app: Express

  beforeEach(createStore(import.meta.url, { format: 'trig', loadAll: true, sliceTestPath: [2, -1] }))

  describe('configured api graphs', () => {
    beforeEach(function () {
      app = express()
        .set('trust proxy', true)
        .use(kopflos({
          codeBase: url.fileURLToPath(new URL('.', import.meta.url)),
          sparql: {
            default: inMemoryClients(this.rdf),
          },
          apiGraphs: [ex.api],
        }))
    })

    it('should call next when no resource shape is found', async () => {
      app.use((req, res) => {
        res.send('not found')
      })

      await request(app)
        .get('/not-found')
        .expect(200, 'not found')
    })

    it('must not stall after first request', async () => {
      await request(app)
        .get('/not-found')
        .expect(404)

      await request(app)
        .get('/not-found')
        .expect(404)
    })

    context('request to resource without explicit handler', () => {
      it('should should return Core representation', async () => {
        const response = await request(app)
          .get('/no-handler')
          .set('host', 'example.org')
          .expect(200)

        expect(response.body).toMatchSnapshot()
      })

      for (const method of ['post', 'put'] as const) {
        it('should should return 405 to ' + method.toUpperCase(), async () => {
          await request(app)[method]('/no-handler')
            .set('host', 'example.org')
            .expect(405)
        })
      }

      it('should support content negotiation', async () => {
        const response = await request(app)
          .get('/no-handler')
          .set('host', 'example.org')
          .set('accept', 'text/turtle')
          .expect('Content-Type', /text\/turtle/)
          .expect(200)

        expect(response.text).toMatchSnapshot()
      })
    })

    it('should respond to HEAD requests', async () => {
      const response = await request(app)
        .head('/no-handler')
        .set('host', 'example.org')
        .expect(200)

      expect(response.body).to.be.empty
    })

    context('request to resource with GET handler', () => {
      it('should should return Core representation', async () => {
        const response = await request(app)
          .get('/with-handler')
          .set('host', 'example.org')
          .expect(200)

        expect(response.body).toMatchSnapshot()
      })

      it('should respond to HEAD requests', async () => {
        const response = await request(app)
          .head('/with-handler')
          .set('host', 'example.org')
          .expect(200)

        expect(response.body).to.be.empty
      })

      it('should support content negotiation', async () => {
        const response = await request(app)
          .get('/with-handler')
          .set('host', 'example.org')
          .set('accept', 'text/turtle')
          .expect('Content-Type', /text\/turtle/)
          .expect(200)

        expect(response.text).toMatchSnapshot()
      })

      it('should forward response headers', async () => {
        await request(app)
          .head('/with-handler')
          .set('host', 'example.org')
          .expect(200)
          .expect('x-handler', 'get-with-handler.js')
      })
    })
  })

  describe('automatic API graph', () => {
    beforeEach(function () {
      app = express()
        .set('trust proxy', true)
        .use(kopflos({
          codeBase: url.fileURLToPath(new URL('.', import.meta.url)),
          sparql: {
            default: inMemoryClients(this.rdf),
          },
        }))
    })

    it('throws an error when no API graphs are configured', async () => {
      await request(app)
        .get('/')
        .expect(500, /No API graphs configured/)
    })
  })
})
