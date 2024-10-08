import type { StreamClient as IStreamClient } from 'sparql-http-client/StreamClient.js'
import StreamClient from 'sparql-http-client/StreamClient.js'
import type { ParsingClient as IParsingClient } from 'sparql-http-client/ParsingClient.js'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type { DataFactory, DatasetCoreFactory } from '@rdfjs/types'
import { decorateClient } from '../log.js'
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

  init(this: Environment<SparqlClientFactory | KopflosFactory | DataFactory | DatasetCoreFactory>) {
    this.sparql = Object.fromEntries(Object.entries(this.kopflos.config.sparql).map(([key, endpointOrClients]) => {
      if (typeof endpointOrClients === 'string') {
        const endpointConfig = {
          factory: this,
          endpointUrl: endpointOrClients,
        }

        return [key, {
          stream: decorateClient(new StreamClient(endpointConfig)),
          parsed: decorateClient(new ParsingClient(endpointConfig)),
        }]
      }

      if ('stream' in endpointOrClients) {
        return [key, {
          parsed: decorateClient(endpointOrClients.parsed),
          stream: decorateClient(endpointOrClients.stream),
        }]
      }

      const endpointConfig = {
        ...endpointOrClients,
        factory: this,
      }

      return [key, {
        stream: decorateClient(new StreamClient(endpointConfig)),
        parsed: decorateClient(new ParsingClient(endpointConfig)),
      }]
    }))
  }
}
