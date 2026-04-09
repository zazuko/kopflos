import type { Term } from '@rdfjs/types'

export function serializeTerm(term: Term) {
  if (term.termType === 'NamedNode') {
    return { type: 'uri', value: term.value }
  }
  if (term.termType === 'BlankNode') {
    return { type: 'bnode', value: term.value }
  }
  if (term.termType === 'Literal') {
    return {
      type: 'literal',
      value: term.value,
      datatype: term.datatype.value,
      'xml:lang': term.language || undefined,
    }
  }
  return { type: 'unknown', value: term.value }
}
