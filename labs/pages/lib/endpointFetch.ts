import { Readable } from 'node:stream'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import type StreamClientImplementation from 'sparql-http-client/StreamClient.js'

/**
 * Adapt Comunica HTTP requests to the configured SPARQL client's transport.
 * Requests to that endpoint fetch query results or endpoint metadata (such as
 * a service description). Query requests use postDirect to retain the client's
 * authentication, headers, dataset parameters, and custom fetch implementation.
 * Requests to other URLs, e.g. explicit SERVICE endpoints, use global fetch.
 * Page URL materialization happens locally; this does not fetch HTML pages or
 * load the Pages routing graph (which SSR loads separately).
 */
export function endpointFetch(client: StreamClient): typeof fetch {
  if (!client.endpointUrl) throw new Error('Page URL queries require a SPARQL endpoint URL')
  const transport = client as StreamClientImplementation
  const endpoint = new URL(client.endpointUrl)
  return async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    // Keep endpoint authentication and custom fetch behavior scoped to that endpoint.
    if (url.origin !== endpoint.origin || url.pathname !== endpoint.pathname) {
      return fetch(input, init)
    }
    const headers = new Headers(init?.headers)
    const body = typeof init?.body === 'string' ? init.body : ''
    const remoteQuery = url.searchParams.get('query')
      ?? (headers.get('content-type')?.startsWith('application/sparql-query') ? body : new URLSearchParams(body).get('query'))
    let response: Response
    if (remoteQuery) {
      headers.delete('content-type')
      response = await transport.postDirect(remoteQuery, { headers })
    }
    else {
      const mergedHeaders = new Headers(client.headers)
      headers.forEach((value, key) => mergedHeaders.set(key, value))
      response = await transport.fetch(input, { ...init, headers: mergedHeaders })
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
