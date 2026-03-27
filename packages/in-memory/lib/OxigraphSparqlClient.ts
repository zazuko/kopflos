import { Readable } from 'node:stream'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { DatasetCore, Quad, Stream, Term } from '@rdfjs/types'
import rdf from '@zazuko/env-node'
import * as oxigraph from 'oxigraph'

class OxigraphClient {
  protected _store: oxigraph.Store
  constructor(store: oxigraph.Store) {
    this._store = store
  }

  protected _query = {
    ask: async (query: string): Promise<boolean> => {
      return this._store.query(query) as boolean
    },
    update: async (query: string): Promise<void> => {
      this._store.update(query)
    },
  }

  store: StreamClient['store'] = {
    get: (graph: Term): Stream & Readable => {
      const results = this._store.match(null, null, null, graph as oxigraph.Quad_Graph)
      return Readable.from(results)
    },
    post: async (stream: Stream, { graph }: { graph?: Term } = {}): Promise<void> => {
      for await (const quad of stream as AsyncIterable<oxigraph.Quad>) {
        this._store.add(oxigraph.quad(quad.subject, quad.predicate, quad.object, graph as oxigraph.Quad_Graph))
      }
    },
    put: async (stream: Stream, { graph }: { graph?: Term } = {}): Promise<void> => {
      const quads = this._store.match(null, null, null, graph as oxigraph.Quad)
      for (const quad of quads) {
        this._store.delete(quad)
      }
      for await (const quad of stream as AsyncIterable<oxigraph.Quad>) {
        this._store.add(oxigraph.quad(quad.subject, quad.predicate, quad.object, graph as oxigraph.Quad_Graph))
      }
    },
  }
}

class OxigraphStreamClient extends OxigraphClient implements StreamClient {
  query: StreamClient['query'] = {
    ...this._query,
    construct: (query: string) => {
      const results = this._store.query(query) as Quad[]
      return Readable.from(results)
    },
    select: (query: string): Stream & Readable => {
      const results = this._store.query(query) as Map<string, Term>[]
      return Readable.from(results)
    },
  }
}

class OxigraphParsingClient extends OxigraphClient implements ParsingClient {
  query: ParsingClient['query'] = {
    ...this._query,
    construct: async (query: string): Promise<DatasetCore> => {
      const quads = this._store.query(query) as Quad[]
      return rdf.dataset(quads)
    },
    select: async (query: string): Promise<Record<string, Term>[]> => {
      const results = this._store.query(query) as Map<string, Term>[]
      return results.map(binding => {
        const obj: Record<string, Term> = {}
        for (const [key, value] of binding) {
          obj[key] = value
        }
        return obj
      })
    },
  }
}

export function createOxigraphClients(store: oxigraph.Store = new oxigraph.Store()) {
  return {
    stream: new OxigraphStreamClient(store),
    parsed: new OxigraphParsingClient(store),
  }
}
