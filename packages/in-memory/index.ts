import * as oxigraph from 'oxigraph'
import { OxigraphParsingClient, OxigraphStreamClient } from './lib/OxigraphSparqlClient.js'

export function createInMemoryClients(store: oxigraph.Store = new oxigraph.Store()) {
  return {
    stream: new OxigraphStreamClient(store),
    parsed: new OxigraphParsingClient(store),
  }
}
