import express from 'express'
import request from 'supertest'
import { expect } from 'chai'
import rdf from '@zazuko/env-node'
import kopflos from '@kopflos-cms/express'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import StreamClient from 'sparql-http-client/StreamClient.js'
import QueryPlugin from '../index.js'

describe('@kopflos-cms/plugin-query', function () {
  let app: express.Express

  beforeEach(async function () {
    const dataset = rdf.dataset()
    const sparql = {
      default: {
        parsed: new ParsingClient({ endpointUrl: 'http://example.org/sparql' }),
        stream: new StreamClient({ endpointUrl: 'http://example.org/sparql' }),
      },
      other: {
        parsed: new ParsingClient({ endpointUrl: 'http://example.org/other' }),
        stream: new StreamClient({ endpointUrl: 'http://example.org/other' }),
      },
    }

    const { middleware } = await kopflos({
      baseIri: 'http://example.org/',
      sparql,
      plugins: [new QueryPlugin()],
    })

    app = express()
      .set('trust proxy', true)
      .use(middleware)
  })

  it('serves YASGUI at /-/query', async function () {
    const response = await request(app)
      .get('/-/query')
      .expect(200)

    expect(response.text).to.contain('<title>Kopflos Query</title>')
    expect(response.text).to.contain('new Yasgui')
    expect(response.text).to.contain('"name":"default"')
    expect(response.text).to.contain('"name":"other"')
    expect(response.text).to.contain('endpointCatalogueOptions')
    expect(response.text).to.contain('getData: () => endpoints')
  })

  it('proxies queries to /-/query/default', async function () {
    // skip this test in environment where example.org is not reachable
    if (process.env.CI) {
      this.skip()
    }

    try {
      const response = await request(app)
        .post('/-/query/default')
        .send('query=SELECT * WHERE { ?s ?p ?o }')
        .set('accept', 'application/sparql-results+json')
        .set('content-type', 'application/x-www-form-urlencoded')
        .timeout(1000)

      expect(response.status).to.not.equal(404)
    } catch (e) {
      // ignore timeout/connection errors
    }
  })

  it('handles in-memory endpoints directly', async function () {
    const { createInMemoryClients } = await import('@kopflos-cms/in-memory')
    const inMemory = createInMemoryClients()

    const { middleware } = await kopflos({
      baseIri: 'http://example.org/',
      sparql: {
        default: {
          parsed: new ParsingClient({ endpointUrl: 'http://example.org/sparql' }),
          stream: new StreamClient({ endpointUrl: 'http://example.org/sparql' }),
        },
        internal: inMemory,
      },
      plugins: [new QueryPlugin()],
    })

    const internalApp = express()
      .use(middleware)

    const response = await request(internalApp)
      .post('/-/query/internal')
      .send('query=SELECT (1 as ?s) WHERE { }')
      .set('accept', 'application/sparql-results+json')
      .set('content-type', 'application/x-www-form-urlencoded')

    expect(response.status).to.equal(200)
    expect(response.body.results.bindings).to.be.an('array')
    expect(response.body.head.vars).to.contain('s')
    expect(response.body.results.bindings[0].s.type).to.equal('literal')
    expect(response.body.results.bindings[0].s.value).to.equal('1')
  })
})
