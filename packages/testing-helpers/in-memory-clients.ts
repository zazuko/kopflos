import type { Clients } from '../core/lib/env/SparqlClientFactory.js'

export default function ({ parsingClient, streamClient }: Mocha.Context['rdf']): Clients {
  return {
    parsed: parsingClient,
    stream: streamClient,
  }
}
