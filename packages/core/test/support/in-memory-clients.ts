import type * as Oxigraph from 'oxigraph'
import type { Quad, Term } from '@rdfjs/types'
import rdf from '@zazuko/env-node'
import toStream from 'into-stream'
import type { Clients } from '../../lib/env/SparqlClientFactory.js'

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
    default:
      throw new Error(`Unsupported term type: ${term.termType}`)
  }
}

export default function (store: Oxigraph.Store): Clients {
  function select(query: string) {
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

  function construct(query: string) {
    const results: Array<Quad> = store.query(query, {
      use_default_graph_as_union: true,
    })

    return rdf.dataset(results.map(termToTerm))
  }

  async function ask(query: string): Promise<boolean> {
    return store.query(query, {
      use_default_graph_as_union: true,
    })
  }

  async function update(query: string) {
    return store.update(query, {})
  }

  return {
    parsed: {
      query: {
        async select(query: string) {
          return select(query)
        },
        async construct(query: string) {
          return construct(query)
        },
        ask,
        update,
      },
      store: {} as unknown as Clients['parsed']['store'],
    },
    stream: {
      query: {
        select(query: string) {
          const bindings = select(query)
          return toStream.object(bindings)
        },
        construct(query: string) {
          const dataset = construct(query)
          return dataset.toStream()
        },
        ask,
        update,
      },
      store: {} as unknown as Clients['stream']['store'],
    },
  }
}
