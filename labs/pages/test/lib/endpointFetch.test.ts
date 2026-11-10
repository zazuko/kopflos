import { expect } from 'chai'
import sinon from 'sinon'
import StreamClient from 'sparql-http-client/StreamClient.js'
import { endpointFetch } from '../../lib/endpointFetch.js'

describe('endpointFetch', function () {
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
    const transport = sinon.stub().resolves(new Response('{}'))
    const client = new StreamClient({ endpointUrl: 'https://example.org/sparql?default-graph-uri=urn:data', fetch: transport })
    const query = 'SELECT * WHERE { ?s ?p ?o }'
    await endpointFetch(client)(`https://example.org/sparql?query=${encodeURIComponent(query)}`)
    const [input, init] = transport.firstCall.args
    expect(new URL(input).searchParams.get('default-graph-uri')).to.equal('urn:data')
    expect(init.method).to.equal('POST')
    expect(init.body).to.equal(query)
    expect(new Headers(init.headers).get('content-type')).to.contain('application/sparql-query')
  })

  it('uses global fetch for other endpoints without forwarding client credentials', async function () {
    const transport = sinon.stub()
    const client = new StreamClient({ endpointUrl: 'https://example.org/sparql', user: 'user', password: 'password', fetch: transport })
    const externalFetch = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'))
    try {
      const input = 'https://other.example/sparql'
      const init = { headers: { accept: 'application/sparql-results+json' } }
      await endpointFetch(client)(input, init)
      expect(externalFetch).to.have.been.calledOnceWithExactly(input, init)
      expect(transport).not.to.have.been.called
      expect(new Headers(externalFetch.firstCall.args[1]?.headers).has('authorization')).to.be.false
    }
    finally {
      externalFetch.restore()
    }
  })
})
