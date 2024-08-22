import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import anylogger from 'anylogger'

const log = anylogger('kopflos:sparql')

export default class <C extends ParsingClient | StreamClient> {
  constructor(private readonly client: C) {
  }

  get query(): C['query'] {
    return {
      select: queryLogger(this.client.query.select),
      construct: queryLogger(this.client.query.construct),
      ask: queryLogger(this.client.query.ask),
      update: this.client.query.update,
    } as C['query']
  }

  get store(): C['store'] {
    return this.client.store
  }
}

function queryLogger<Q extends(query: string) => ReturnType<Q>>(query: Q): Q {
  return ((q: string) => {
    if (log.enabledFor('debug')) {
      log.debug('Executing query %s', q)
    }
    return query(q)
  }) as Q
}
