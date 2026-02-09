import url from 'node:url'
import express, { type Express } from 'express'
import { createStore } from 'mocha-chai-rdf/store.js'
import request from 'supertest'
import ExpressMiddleware from '../plugin/middleware.js'
import kopflos from '../index.js'
import inMemoryClients from '../../testing-helpers/in-memory-clients.js'
import { ex } from '../../testing-helpers/ns.js'

describe('@kopflos-cms/express/middleware', function () {
  let app: Express

  beforeEach(createStore(import.meta.url, {
    format: 'trig',
    loadAll: true,
  }))

  beforeEach(async function () {
    this.timeout(5000)

    const { middleware } = await kopflos({
      baseIri: 'http://example.org/',
      codeBase: url.fileURLToPath(new URL('.', import.meta.url)),
      sparql: {
        default: inMemoryClients(this.rdf),
      },
      apiGraphs: [ex.api],
      plugins: [new ExpressMiddleware({
        before: [
          ['cors', { origin: 'example.org' }],
          url.fileURLToPath(new URL('.', import.meta.url) + 'middleware/before.js'),
        ],
        after: [
          url.fileURLToPath(new URL('.', import.meta.url) + 'middleware/after.js'),
        ],
      })],
    })

    app = express()
      .set('trust proxy', true)
      .use(middleware)
  })

  it('sets headers in before middleware', async function () {
    await request(app)
      .get('/')
      .set('host', 'example.org')
      .expect(200)
      .expect('handler')
      .expect('Access-Control-Allow-Origin', 'example.org')
  })

  it('runs after middleware when kopflos middleware returns 404', async function () {
    await request(app)
      .get('/not-found')
      .set('host', 'example.org')
      .expect(200)
      .expect('after')
  })

  it('can return from before middleware', async function () {
    await request(app)
      .get('/stop')
      .set('host', 'example.org')
      .expect(200)
      .expect('stopped')
  })
})
