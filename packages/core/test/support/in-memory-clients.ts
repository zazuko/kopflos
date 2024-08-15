import type { Clients } from '../../lib/env/SparqlClientFactory.js'

export default function ({ parsingClient, streamClient }: Mocha.Context['rdf']): Clients {
  return {
    parsed: parsingClient,
    stream: streamClient,
  }
}
