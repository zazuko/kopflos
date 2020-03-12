const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }

function setGraph (dataset, graph = rdf.defaultGraph()) {
  return rdf.dataset([...dataset].map(quad => {
    return rdf.quad(quad.subject, quad.predicate, quad.object, graph)
  }))
}

module.exports = setGraph
