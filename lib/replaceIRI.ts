import rdf from '@zazuko/env-node'
import type { Term, Quad, DatasetCore, NamedNode } from '@rdfjs/types'

export function replaceTermIRI<T extends Term>(oldIRI: string | NamedNode, newIRI: string | NamedNode, term: T): T {
  const oldIRIString = typeof oldIRI === 'string' ? oldIRI : oldIRI.value
  const newIRIString = typeof newIRI === 'string' ? newIRI : newIRI.value

  if (term.termType !== 'NamedNode') {
    return term as T
  }

  if (!term.value.startsWith(oldIRIString)) {
    return term as T
  }

  return rdf.namedNode(newIRIString + term.value.slice(oldIRIString.length)) as T
}

export function replaceQuadIRI(oldIRI: string | NamedNode, newIRI: string | NamedNode, quad: Quad) {
  return rdf.quad(
    replaceTermIRI(oldIRI, newIRI, quad.subject),
    replaceTermIRI(oldIRI, newIRI, quad.predicate),
    replaceTermIRI(oldIRI, newIRI, quad.object),
    replaceTermIRI(oldIRI, newIRI, quad.graph),
  )
}

export function replaceDatasetIRI(oldIRI: string | NamedNode, newIRI: string | NamedNode, dataset: DatasetCore) {
  return rdf.dataset([...dataset].map(quad => replaceQuadIRI(oldIRI, newIRI, quad)))
}
