import type * as Oxigraph from 'oxigraph'
import { parsingClient, streamClient } from 'mocha-chai-rdf/sparql-clients.js'
import type { Clients } from '../../lib/env/SparqlClientFactory.js'

export default function (store: Oxigraph.Store): Clients {
  return {
    parsed: parsingClient(store),
    stream: streamClient(store),
  }
}
