import { Readable } from 'node:stream'
import onetime from 'onetime'
import type { DataFactory } from '@rdfjs/types'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import type { createPageUrlExtension } from './pageUrl.js'
import { pageUrlFunction } from './pageUrl.js'
import type SparqlProcessor from './SparqlProcessor.js'
import { endpointFetch } from './endpointFetch.js'
import { clientFetch } from './clientFetch.js'
import { clientSourceUrl } from './sparqlRequest.js'

// Load and instantiate Comunica only when a query needs local page resolution.
// Reuse the engine, while keeping routes and transport credentials query-local.
const loadQueryEngine = onetime(async () => {
  const { QueryEngine } = await import('@comunica/query-sparql')
  return new QueryEngine()
})

export function queryClient(client: StreamClient, processor: SparqlProcessor, pageUrl: ReturnType<typeof createPageUrlExtension>, dataFactory: DataFactory): StreamClient {
  return {
    ...client,
    query: {
      ...client.query,
      construct(query: string) {
        if (!processor.usesPageUrl) return client.query.construct(query)
        return Readable.from((async function* () {
          const engine = await loadQueryEngine()
          yield* await engine.queryQuads(query, {
            dataFactory,
            // Apply this at both levels because source contexts are preprocessed
            // independently. The endpoint need not implement kopflos:pageUrl.
            sources: [{ type: 'sparql', value: clientSourceUrl, context: { extensionFunctionsAlwaysPushdown: false } }],
            extensionFunctionsAlwaysPushdown: false,
            extensionFunctions: { [pageUrlFunction]: pageUrl },
            fetch: client.endpointUrl ? endpointFetch(client, clientSourceUrl) : clientFetch(client),
          })
        })())
      },
    },
  } as StreamClient
}
