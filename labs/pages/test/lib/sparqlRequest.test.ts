import { expect } from 'chai'
import { clientSourceUrl, sparqlRequest } from '../../lib/sparqlRequest.js'

describe('sparqlRequest', function () {
  const query = 'SELECT ?s WHERE { ?s ?p ?o }'
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
