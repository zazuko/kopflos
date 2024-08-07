import type { Options, StreamClient as IStreamClient } from 'sparql-http-client/StreamClient.js'
import StreamClient from 'sparql-http-client/StreamClient.js'
import type { ParsingClient as IParsingClient } from 'sparql-http-client/ParsingClient.js'
import ParsingClient from 'sparql-http-client/ParsingClient.js'

export interface Clients {
  stream: IStreamClient
  parsed: IParsingClient
}

export interface SparqlClientFactory {
  sparql: Record<string, Clients>
}

export default (endpoints: Record<string, Options | Clients>) => class implements SparqlClientFactory {
  sparql!: Record<string, Clients>

  init() {
    this.sparql = Object.fromEntries(Object.entries(endpoints).map(([key, endpointOrClients]) => {
      if ('stream' in endpointOrClients) {
        return [key, endpointOrClients]
      }

      return [key, {
        stream: new StreamClient(endpointOrClients),
        parsed: new ParsingClient(endpointOrClients),
      }]
    }))
  }
}
