import rdf from '@zazuko/env-node'

export function replaceTermIRI(oldIRI, newIRI, term) {
  if (term.termType !== 'NamedNode') {
    return term
  }

  if (!term.value.startsWith(oldIRI)) {
    return term
  }

  return rdf.namedNode(newIRI + term.value.slice(oldIRI.length))
}

export function replaceQuadIRI(oldIRI, newIRI, quad) {
  return rdf.quad(
    replaceTermIRI(oldIRI, newIRI, quad.subject),
    replaceTermIRI(oldIRI, newIRI, quad.predicate),
    replaceTermIRI(oldIRI, newIRI, quad.object),
    replaceTermIRI(oldIRI, newIRI, quad.graph),
  )
}

export function replaceDatasetIRI(oldIRI, newIRI, dataset) {
  return rdf.dataset([...dataset].map(quad => replaceQuadIRI(oldIRI, newIRI, quad)))
}
