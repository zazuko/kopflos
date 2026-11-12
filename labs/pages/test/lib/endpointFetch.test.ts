import { expect } from 'chai'
import sinon from 'sinon'
import StreamClient from 'sparql-http-client/StreamClient.js'
import { createInMemoryClients } from '../../../../packages/in-memory/index.js'
import { endpointFetch } from '../../lib/endpointFetch.js'
import { clientSourceUrl } from '../../lib/sparqlRequest.js'

describe('endpointFetch', function () {
  it('rejects clients without an endpoint URL', function () {
    // Given
    const { stream: client } = createInMemoryClients()

    // When
    const createFetch = () => endpointFetch(client)

    // Then
    expect(createFetch).to.throw('Page URL queries require a SPARQL endpoint URL')
  })

  it('fetches endpoint metadata using the configured transport and authentication', async function () {
    const transport = sinon.stub().resolves(new Response('', { headers: { 'content-type': 'text/turtle' } }))
    const client = new StreamClient({ endpointUrl: 'https://example.org/sparql', user: 'user', password: 'password', fetch: transport })
    const response = await endpointFetch(client)(client.endpointUrl!, { headers: { accept: 'text/turtle' } })
    expect(response.headers.get('content-type')).to.equal('text/turtle')
    const headers = new Headers(transport.firstCall.args[1].headers)
    expect(headers.get('authorization')).to.equal(client.headers!.get('authorization'))
    expect(headers.get('accept')).to.equal('text/turtle')
  })

  it('sends an encoded query through the configured client', async function () {
    // Given
    const transport = sinon.stub().resolves(new Response('{}'))
    const client = new StreamClient({ endpointUrl: 'https://example.org/sparql?default-graph-uri=urn:data', fetch: transport })
    const query = 'SELECT * WHERE { ?s ?p ?o }'

    // When
    await endpointFetch(client, clientSourceUrl)(`${clientSourceUrl}?query=${encodeURIComponent(query)}`)

    // Then
    const [input, init] = transport.firstCall.args
    expect(new URL(input).searchParams.get('default-graph-uri')).to.equal('urn:data')
    expect(init.method).to.equal('POST')
    expect(init.body).to.equal(query)
    expect(new Headers(init.headers).get('content-type')).to.contain('application/sparql-query')
  })

  for (const selector of ['?default-graph-uri=urn:b', '?named-graph-uri=urn:b', '?default-graph-uri=urn:b&default-graph-uri=urn:c&named-graph-uri=urn:d', '']) {
    it(`uses the configured transport and authentication for SERVICE ${selector || 'without selectors'}`, async function () {
      // Given
      const transport = sinon.stub().resolves(new Response('{}'))
      const client = new StreamClient({ endpointUrl: 'https://example.org/sparql?default-graph-uri=urn:a', user: 'user', password: 'password', headers: { 'x-client': 'custom', 'accept': 'text/turtle' }, fetch: transport })
      const externalFetch = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'))
      const input = `https://example.org/sparql${selector}`
      const init = { method: 'POST', headers: { 'content-type': 'application/sparql-query', 'accept': 'application/sparql-results+json' }, body: 'SELECT * WHERE { ?s ?p ?o }' }

      try {
        // When
        await endpointFetch(client, clientSourceUrl)(input, init)

        // Then
        expect(externalFetch).not.to.have.been.called
        expect(transport).to.have.been.calledOnce
        expect(transport.firstCall.args[0]).to.equal(input)
        expect(transport.firstCall.args[1].method).to.equal(init.method)
        expect(transport.firstCall.args[1].body).to.equal(init.body)
        const headers = new Headers(transport.firstCall.args[1].headers)
        expect(headers.get('authorization')).to.equal(client.headers!.get('authorization'))
        expect(headers.get('x-client')).to.equal('custom')
        expect(headers.get('accept')).to.equal('application/sparql-results+json')
        expect(headers.get('content-type')).to.equal('application/sparql-query')
      }
      finally {
        externalFetch.restore()
      }
    })
  }

  it('fetches source metadata from the configured endpoint rather than its internal identity', async function () {
    // Given
    const transport = sinon.stub().resolves(new Response('', { headers: { 'content-type': 'text/turtle' } }))
    const client = new StreamClient({ endpointUrl: 'https://example.org/sparql?default-graph-uri=urn:a', fetch: transport })

    // When
    await endpointFetch(client, clientSourceUrl)(clientSourceUrl, { headers: { accept: 'text/turtle' } })

    // Then
    expect(String(transport.firstCall.args[0])).to.equal(client.endpointUrl)
  })

  it('preserves Request options when rewriting the source metadata URL', async function () {
    // Given
    const transport = sinon.stub().resolves(new Response(''))
    const client = new StreamClient({ endpointUrl: 'https://example.org/sparql?default-graph-uri=urn:a', user: 'user', password: 'password', fetch: transport })
    const controller = new AbortController()
    const input = new Request(clientSourceUrl, {
      method: 'POST',
      body: 'metadata',
      headers: { 'content-type': 'text/plain', 'x-request': 'custom' },
      signal: controller.signal,
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual',
    })

    // When
    await endpointFetch(client, clientSourceUrl)(input)
    const forwarded = new Request(...transport.firstCall.args as [RequestInfo, RequestInit])
    controller.abort()

    // Then
    expect(forwarded.url).to.equal(client.endpointUrl)
    expect(forwarded.method).to.equal('POST')
    expect(await forwarded.text()).to.equal('metadata')
    expect(forwarded.headers.get('x-request')).to.equal('custom')
    expect(forwarded.headers.get('authorization')).to.equal(client.headers!.get('authorization'))
    expect(forwarded.credentials).to.equal('include')
    expect(forwarded.cache).to.equal('no-store')
    expect(forwarded.redirect).to.equal('manual')
    expect(forwarded.signal.aborted).to.be.true
    expect(await input.text()).to.equal('metadata')
  })

  it('applies init overrides when rewriting a metadata Request', async function () {
    // Given
    const transport = sinon.stub().resolves(new Response(''))
    const client = new StreamClient({ endpointUrl: 'https://example.org/sparql', headers: { 'x-client': 'custom' }, fetch: transport })
    const input = new Request(clientSourceUrl, { method: 'POST', body: 'original', headers: { 'x-request': 'original' } })
    const init = { method: 'PUT', body: 'replacement', headers: { 'x-request': 'override' } }

    // When
    await endpointFetch(client, clientSourceUrl)(input, init)
    const forwarded = new Request(...transport.firstCall.args as [RequestInfo, RequestInit])

    // Then
    expect(forwarded.url).to.equal(client.endpointUrl)
    expect(forwarded.method).to.equal('PUT')
    expect(await forwarded.text()).to.equal('replacement')
    expect(forwarded.headers.get('x-request')).to.equal('override')
    expect(forwarded.headers.get('x-client')).to.equal('custom')
    expect(await input.text()).to.equal('original')
  })

  it('preserves SERVICE selectors when Comunica appends a second query separator', async function () {
    // Given
    const transport = sinon.stub().resolves(new Response('{}'))
    const client = new StreamClient({ endpointUrl: 'https://example.org/sparql?default-graph-uri=urn:a', user: 'user', password: 'password', fetch: transport })
    const query = 'SELECT * WHERE { ?s ?p ?o }'
    const input = `https://example.org/sparql?default-graph-uri=urn:b?query=${encodeURIComponent(query)}`

    // When
    await endpointFetch(client, clientSourceUrl)(input)

    // Then
    const requested = new URL(transport.firstCall.args[0].toString())
    expect(requested.searchParams.get('default-graph-uri')).to.equal('urn:b')
    expect(requested.searchParams.get('query')).to.equal(query)
    expect(new Headers(transport.firstCall.args[1].headers).get('authorization')).to.equal(client.headers!.get('authorization'))
  })

  for (const input of ['https://other.example/sparql', 'https://example.org/other']) {
    it(`uses global fetch for ${input} without forwarding client credentials`, async function () {
      // Given
      const transport = sinon.stub()
      const client = new StreamClient({ endpointUrl: 'https://example.org/sparql', user: 'user', password: 'password', fetch: transport })
      const externalFetch = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'))
      const init = { headers: { accept: 'application/sparql-results+json' } }

      try {
        // When
        await endpointFetch(client)(input, init)

        // Then
        expect(externalFetch).to.have.been.calledOnceWithExactly(input, init)
        expect(transport).not.to.have.been.called
        expect(new Headers(externalFetch.firstCall.args[1]?.headers).has('authorization')).to.be.false
      }
      finally {
        externalFetch.restore()
      }
    })
  }
})
