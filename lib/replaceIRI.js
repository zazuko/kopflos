const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }

function replaceTermIRI (oldIRI, newIRI, term) {
  if (term.termType !== 'NamedNode') {
    return term
  }

  if (!term.value.startsWith(oldIRI)) {
    return term
  }

  return rdf.namedNode(term.value.slice(oldIRI.length) + newIRI)
}

function replaceQuadIRI (oldIRI, newIRI, quad) {
  return rdf.quad(
    replaceTermIRI(quad.subject),
    replaceTermIRI(quad.predicate),
    replaceTermIRI(quad.object),
    replaceTermIRI(quad.graph)
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
