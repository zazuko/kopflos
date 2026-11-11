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
import type StreamQuery from 'sparql-http-client/StreamQuery.js'

// Load and instantiate Comunica only when a query needs local page resolution.
// Reuse the engine, while keeping routes and transport credentials query-local.
const loadQueryEngine = onetime(async () => {
  const { QueryEngine } = await import('@comunica/query-sparql')
  return new QueryEngine()
})

type PageUrlFunction = ReturnType<typeof createPageUrlExtension>

class ComunicaQuery implements StreamQuery {
  private readonly fetch: typeof fetch
  public readonly ask: StreamQuery['ask']
  public readonly select: StreamQuery['select']
  public readonly update: StreamQuery['update']

  constructor(private client: StreamClient, private processor: SparqlProcessor, private dataFactory: DataFactory, private pageUrl: PageUrlFunction) {
    this.fetch = client.endpointUrl ? endpointFetch(client, clientSourceUrl) : clientFetch(client)

    this.ask = this.client.query.ask.bind(this.client.query)
    this.select = this.client.query.select.bind(this.client.query)
    this.update = this.client.query.update.bind(this.client.query)
  }

  construct(...args: Parameters<StreamQuery['construct']>) {
    if (!this.processor.usesPageUrl) return this.client.query.construct(...args)

    const [query] = args
    const { fetch, dataFactory, pageUrl } = this

    return Readable.from((async function* () {
      const engine = await loadQueryEngine()
      yield* await engine.queryQuads(query, {
        dataFactory,
        // Apply this at both levels because source contexts are preprocessed
        // independently. The endpoint need not implement kopflos:pageUrl.
        sources: [{ type: 'sparql', value: clientSourceUrl, context: { extensionFunctionsAlwaysPushdown: false } }],
        extensionFunctionsAlwaysPushdown: false,
        extensionFunctions: { [pageUrlFunction]: pageUrl },
        fetch,
      })
    })())
  }
}

export function queryClient(client: StreamClient, processor: SparqlProcessor, pageUrl: PageUrlFunction, dataFactory: DataFactory): StreamClient {
  const wrapped: StreamClient = Object.create(client)
  wrapped.query = new ComunicaQuery(client, processor, dataFactory, pageUrl)
  return wrapped
}
