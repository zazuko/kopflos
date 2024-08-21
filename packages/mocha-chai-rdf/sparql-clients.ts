import type * as Oxigraph from 'oxigraph'
import type { Quad, Term } from '@rdfjs/types'
import rdf from '@zazuko/env-node'
import toStream from 'into-stream'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'

function termToTerm<T extends Term>(term: T): T {
  // repackage terms using Zazuko's env-node to fix chai assertions
  switch (term.termType) {
    case 'NamedNode':
      return rdf.namedNode(term.value) as T
    case 'BlankNode':
      return rdf.blankNode(term.value) as T
    case 'Literal':
      return rdf.literal(term.value, term.language || term.datatype) as T
    case 'Variable':
      return rdf.variable(term.value) as T
    case 'Quad':
      return rdf.quad(
        termToTerm(term.subject),
        termToTerm(term.predicate),
        termToTerm(term.object),
        termToTerm(term.graph),
      ) as T
    case 'DefaultGraph':
      return rdf.defaultGraph() as T
    default:
      throw new Error(`Unsupported term type: ${term}`)
  }
}

function select(store: Oxigraph.Store, query: string) {
  const results: Array<Map<string, Term>> = store.query(query, {
    use_default_graph_as_union: true,
  })

  return results.map((result) => {
    const bindings: Record<string, Term> = {}

    for (const [key, value] of result.entries()) {
      bindings[key] = termToTerm(value)
    }

    return bindings
  })
}

function construct(store: Oxigraph.Store, query: string) {
  const results: Array<Quad> = store.query(query, {
    use_default_graph_as_union: true,
  })

  return rdf.dataset(results.map(termToTerm))
}

async function ask(store: Oxigraph.Store, query: string): Promise<boolean> {
  return store.query(query, {
    use_default_graph_as_union: true,
  })
}

async function update(store: Oxigraph.Store, query: string) {
  return store.update(query, {})
}

export function parsingClient(store: Oxigraph.Store): ParsingClient {
  return {
    query: {
      async select(query: string) {
        return select(store, query)
      },
      async construct(query: string) {
        return construct(store, query)
      },
      ask: ask.bind(null, store),
      update: update.bind(null, store),
    },
    store: {} as unknown as ParsingClient['store'],
  }
}

export function streamClient(store: Oxigraph.Store): StreamClient {
  return {
    query: {
      select(query: string) {
        const bindings = select(store, query)
        return toStream.object(bindings)
      },
      construct(query: string) {
        const dataset = construct(store, query)
        return dataset.toStream()
      },
      ask: ask.bind(null, store),
      update: update.bind(null, store),
    },
    store: {} as unknown as StreamClient['store'],
  }
}
