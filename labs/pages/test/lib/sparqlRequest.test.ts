import { expect } from 'chai'
import { clientSourceUrl, sparqlRequest } from '../../lib/sparqlRequest.js'

describe('sparqlRequest', function () {
  const query = 'SELECT ?s WHERE { ?s ?p ?o }'

  it('repairs a second query separator while preserving Request options', async function () {
    // Given
    const input = new Request(`${clientSourceUrl}?default-graph-uri=urn:data?query=${encodeURIComponent(query)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/sparql-query', 'x-client': 'custom' },
      body: query,
    })

    // When
    const result = await sparqlRequest(input)
    const repaired = result.input as Request

    // Then
    expect(result.query).to.equal(query)
    expect(result.source).to.equal(`${clientSourceUrl}?default-graph-uri=urn%3Adata`)
    expect(new URL(repaired.url).searchParams.get('query')).to.equal(query)
    expect(repaired.method).to.equal('POST')
    expect(repaired.headers.get('x-client')).to.equal('custom')
    expect(repaired.headers.get('content-type')).to.equal('application/sparql-query')
    expect(await repaired.text()).to.equal(query)
    expect(await input.text()).to.equal(query)
  })

  const requests: [string, Parameters<typeof fetch>[0], RequestInit?][] = [
    ['GET string', `${clientSourceUrl}?query=${encodeURIComponent(query)}`],
    ['GET URL', new URL(`${clientSourceUrl}?query=${encodeURIComponent(query)}`)],
    ['direct POST', clientSourceUrl, { headers: { 'content-type': 'application/sparql-query' }, body: query }],
    ['form POST', clientSourceUrl, { body: new URLSearchParams({ query }) }],
    ['Request', new Request(clientSourceUrl, { method: 'POST', headers: { 'content-type': 'application/sparql-query' }, body: query })],
  ]

  for (const [name, input, init] of requests) {
    it(`reads the query and source from a ${name}`, async function () {
      // Given
      const expectedSource = clientSourceUrl

      // When
      const result = await sparqlRequest(input, init)

      // Then
      expect(result.query).to.equal(query)
      expect(result.source).to.equal(expectedSource)
    })
  }
})
