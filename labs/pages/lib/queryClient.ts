import { Readable } from 'node:stream'
import onetime from 'onetime'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import type { createPageUrlExtension } from './pageUrl.js'
import { pageUrlFunction } from './pageUrl.js'
import type SparqlProcessor from './SparqlProcessor.js'
import { endpointFetch } from './endpointFetch.js'

// Load and instantiate Comunica only when a query needs local page resolution.
// Reuse the engine, while keeping routes and transport credentials query-local.
const loadQueryEngine = onetime(async () => {
  const { QueryEngine } = await import('@comunica/query-sparql')
  return new QueryEngine()
})

export function queryClient(client: StreamClient, processor: SparqlProcessor, pageUrl: ReturnType<typeof createPageUrlExtension>): StreamClient {
  return {
    ...client,
    query: {
      ...client.query,
      construct(query: string) {
        if (!processor.usesPageUrl) return client.query.construct(query)
        return Readable.from((async function* () {
          if (!client.endpointUrl) throw new Error('Page URL queries require a SPARQL endpoint URL')
          const engine = await loadQueryEngine()
          yield* await engine.queryQuads(query, {
            // Apply this at both levels because source contexts are preprocessed
            // independently. The endpoint need not implement kopflos:pageUrl.
            sources: [{ type: 'sparql', value: client.endpointUrl, context: { extensionFunctionsAlwaysPushdown: false } }],
            extensionFunctionsAlwaysPushdown: false,
            extensionFunctions: { [pageUrlFunction]: pageUrl },
            fetch: endpointFetch(client),
          })
        })())
      },
    },
  } as StreamClient
}
