const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }

function replaceTermIRI (oldIRI, newIRI, term) {
  if (term.termType !== 'NamedNode') {
    return term
  }

  if (!term.value.startsWith(oldIRI)) {
    return term
  }

  return rdf.namedNode(newIRI + term.value.slice(oldIRI.length))
}

function replaceQuadIRI (oldIRI, newIRI, quad) {
  return rdf.quad(
    replaceTermIRI(oldIRI, newIRI, quad.subject),
    replaceTermIRI(oldIRI, newIRI, quad.predicate),
    replaceTermIRI(oldIRI, newIRI, quad.object),
    replaceTermIRI(oldIRI, newIRI, quad.graph)
  )
}

function replaceDatasetIRI (oldIRI, newIRI, dataset) {
  return rdf.dataset([...dataset].map(quad => replaceQuadIRI(oldIRI, newIRI, quad)))
}

module.exports = {
  replaceTermIRI,
  replaceQuadIRI,
  replaceDatasetIRI
}
