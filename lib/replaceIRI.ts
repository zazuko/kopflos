import type { Term, Quad, NamedNode, DataFactory } from '@rdfjs/types'
import type { Environment } from '@rdfjs/environment/Environment.js'
import Factory, { ExtractDataset } from './factory.js'

export function replaceTermIRI<T extends Term>(oldIRI: string | NamedNode, newIRI: string | NamedNode, term: T, factory: Environment<DataFactory>): T {
  const oldIRIString = typeof oldIRI === 'string' ? oldIRI : oldIRI.value
  const newIRIString = typeof newIRI === 'string' ? newIRI : newIRI.value

  if (term.termType !== 'NamedNode') {
    return term as T
  }

  if (!term.value.startsWith(oldIRIString)) {
    return term as T
  }

  return factory.namedNode(newIRIString + term.value.slice(oldIRIString.length)) as T
}

export function replaceQuadIRI(oldIRI: string | NamedNode, newIRI: string | NamedNode, quad: Quad, factory: Environment<DataFactory>) {
  return factory.quad(
    replaceTermIRI(oldIRI, newIRI, quad.subject, factory),
    replaceTermIRI(oldIRI, newIRI, quad.predicate, factory),
    replaceTermIRI(oldIRI, newIRI, quad.object, factory),
    replaceTermIRI(oldIRI, newIRI, quad.graph, factory),
  )
}

export function replaceDatasetIRI<E extends Factory>(oldIRI: string | NamedNode, newIRI: string | NamedNode, dataset: ExtractDataset<E>, factory: E): ExtractDataset<E> {
  return factory.dataset([...dataset].map(quad => replaceQuadIRI(oldIRI, newIRI, quad, factory))) as unknown as ExtractDataset<E>
}
