import { Readable } from 'node:stream'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import type StreamClientImplementation from 'sparql-http-client/StreamClient.js'
import { sparqlRequest } from './sparqlRequest.js'

/**
 * Adapt Comunica HTTP requests to the configured SPARQL client's transport.
 * Requests to the configured source fetch query results or endpoint metadata (such as
 * a service description). Query requests use postDirect to retain the client's
 * authentication, headers, dataset parameters, and custom fetch implementation.
 * SERVICE targets at the same endpoint retain their URL and use the client's
 * fetch and headers. Other endpoints use global fetch without client credentials.
 * Page URL materialization happens locally; this does not fetch HTML pages or
 * load the Pages routing graph (which SSR loads separately).
 */
export function endpointFetch(client: StreamClient, sourceUrl = client.endpointUrl): typeof fetch {
  if (!client.endpointUrl) throw new Error('Page URL queries require a SPARQL endpoint URL')
  const transport = client as StreamClientImplementation
  const endpoint = new URL(client.endpointUrl)
  const source = new URL(sourceUrl ?? client.endpointUrl)
  source.searchParams.sort()
  return async (input, init) => {
    const request = await sparqlRequest(input, init)
    const configuredSource = request.source === source.href
    const target = new URL(request.source)
    // Keep endpoint authentication and custom fetch behavior scoped to that endpoint.
    if (!configuredSource && (target.origin !== endpoint.origin || target.pathname !== endpoint.pathname)) {
      return fetch(request.input, init)
    }
    const { headers, query } = request
    let response: Response
    if (configuredSource && query) {
      headers.delete('content-type')
      response = await transport.postDirect(query, { headers })
    }
    else {
      const mergedHeaders = new Headers(client.headers)
      headers.forEach((value, key) => mergedHeaders.set(key, value))
      response = await transport.fetch(configuredSource ? endpoint : request.input, { ...init, headers: mergedHeaders })
    }
    // sparql-http-client's default fetch exposes a Node readable body.
    if (response.body instanceof Readable) {
      return new Response(Readable.toWeb(response.body) as ReadableStream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }
    return response
  }
}
