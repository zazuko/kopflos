import type { StreamClient as IStreamClient } from 'sparql-http-client/StreamClient.js'
import StreamClient from 'sparql-http-client/StreamClient.js'
import type { ParsingClient as IParsingClient } from 'sparql-http-client/ParsingClient.js'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type { KopflosFactory } from './KopflosFactory.js'

export interface Clients {
  stream: IStreamClient
  parsed: IParsingClient
}

export interface SparqlClientFactory {
  sparql: Record<string, Clients>
}

export default class implements SparqlClientFactory {
  sparql!: Record<string, Clients>

  init(this: Environment<SparqlClientFactory | KopflosFactory>) {
    this.sparql = Object.fromEntries(Object.entries(this.kopflos.config.sparql).map(([key, endpointOrClients]) => {
      if (typeof endpointOrClients === 'string') {
        const endpointConfig = { endpointUrl: endpointOrClients }

        return [key, {
          stream: new StreamClient(endpointConfig),
          parsed: new ParsingClient(endpointConfig),
        }]
      }

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
