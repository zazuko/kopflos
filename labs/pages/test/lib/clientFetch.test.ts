import { PassThrough, Readable } from 'node:stream'
import { expect } from 'chai'
import sinon from 'sinon'
import env from '@zazuko/env-node'
import { createInMemoryClients } from '../../../../packages/in-memory/index.js'
import { clientFetch } from '../../lib/clientFetch.js'
import { clientSourceUrl } from '../../lib/sparqlRequest.js'

describe('clientFetch', function () {
  it('delegates ASK queries to the configured client', async function () {
    // Given
    const { stream: client } = createInMemoryClients()
    const query = 'ASK { ?s ?p ?o }'
    const ask = sinon.stub(client.query, 'ask').resolves(true)

    // When
    const response = await clientFetch(client)(clientSourceUrl, { method: 'POST', headers: { 'content-type': 'application/sparql-query' }, body: query })

    // Then
    expect(ask).to.have.been.calledOnceWithExactly(query)
    expect(await response.json()).to.deep.equal({ head: {}, boolean: true })
  })

  it('preserves record bindings and initially unbound variables', async function () {
    // Given
    const { stream: client } = createInMemoryClients()
    const query = 'SELECT ?s ?name ?missing WHERE { ?s ?p ?o OPTIONAL { ?s <urn:name> ?name } }'
    sinon.stub(client.query, 'select').returns(Readable.from([
      { s: env.namedNode('urn:first') },
      { s: env.namedNode('urn:second'), name: env.literal('Zweite', 'de') },
    ]))

    // When
    const response = await clientFetch(client)(clientSourceUrl, { method: 'POST', body: new URLSearchParams({ query }) })

    // Then
    expect(await response.json()).to.deep.equal({
      head: { vars: ['s', 'name', 'missing'] },
      results: { bindings: [
        { s: { type: 'uri', value: 'urn:first' } },
        { s: { type: 'uri', value: 'urn:second' }, name: { 'type': 'literal', 'value': 'Zweite', 'xml:lang': 'de' } },
      ] },
    })
  })

  it('retains projected variables when there are no results', async function () {
    // Given
    const { stream: client } = createInMemoryClients()
    const query = 'SELECT ?s (STR(?s) AS ?name) WHERE { ?s ?p ?o }'

    // When
    const response = await clientFetch(client)(`${clientSourceUrl}?query=${encodeURIComponent(query)}`)

    // Then
    expect(await response.json()).to.deep.equal({ head: { vars: ['s', 'name'] }, results: { bindings: [] } })
  })

  it('discovers SELECT * variables without collecting the rows', async function () {
    // Given
    const { stream: client } = createInMemoryClients()
    const query = 'SELECT * WHERE { ?s ?p ?o }'
    sinon.stub(client.query, 'select').returns(Readable.from([
      new Map([['s', env.namedNode('urn:first')]]),
      new Map([['name', env.literal('Second')]]),
    ]))

    // When
    const response = await clientFetch(client)(`${clientSourceUrl}?query=${encodeURIComponent(query)}`)
    const result = await response.json()

    // Then
    expect(result.head.vars).to.deep.equal(['s', 'name'])
    expect(result.results.bindings).to.have.length(2)
  })

  it('streams JSON before the client stream ends and closes it on cancellation', async function () {
    // Given
    const { stream: client } = createInMemoryClients()
    const rows = new PassThrough({ objectMode: true, highWaterMark: 1 })
    rows.write(new Map([['s', env.namedNode('urn:subject')]]))
    sinon.stub(client.query, 'select').returns(rows)
    const query = 'SELECT ?s WHERE { ?s ?p ?o }'
    const response = await clientFetch(client)(`${clientSourceUrl}?query=${encodeURIComponent(query)}`)
    const reader = response.body!.getReader()

    try {
      // When
      await reader.read()
      const first = await reader.read()
      await reader.cancel()

      // Then
      expect(first.done).to.be.false
      expect(JSON.parse(new TextDecoder().decode(first.value))).to.deep.equal({ s: { type: 'uri', value: 'urn:subject' } })
      expect(rows.readableEnded).to.be.false
      expect(rows.destroyed).to.be.true
    }
    finally {
      rows.destroy()
      reader.releaseLock()
    }
  })

  it('propagates client stream errors through the response body', async function () {
    // Given
    const { stream: client } = createInMemoryClients()
    sinon.stub(client.query, 'select').returns(new Readable({
      objectMode: true,
      read() { this.destroy(new Error('Store unavailable')) },
    }))
    const query = 'SELECT * WHERE { ?s ?p ?o }'

    // When
    const response = await clientFetch(client)(`${clientSourceUrl}?query=${encodeURIComponent(query)}`)
    const result = response.text()

    // Then
    await expect(result).to.be.rejectedWith('Store unavailable')
  })

  it('handles client errors before the response body is consumed', async function () {
    // Given
    const { stream: client } = createInMemoryClients()
    const rows = new PassThrough({ objectMode: true })
    sinon.stub(client.query, 'select').returns(rows)
    const query = 'SELECT ?s WHERE { ?s ?p ?o }'
    const response = await clientFetch(client)(`${clientSourceUrl}?query=${encodeURIComponent(query)}`)

    // When
    rows.destroy(new Error('Store unavailable'))
    const result = response.text()

    // Then
    await expect(result).to.be.rejectedWith('Store unavailable')
  })
})
