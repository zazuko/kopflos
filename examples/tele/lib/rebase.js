const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const { isRelative, resolve } = require('./iri')

function rebaseBlankNode (dataset, base) {
  const mappedTerms = new Map([['', base]])

  return rdf.dataset([...dataset].map(quad => {
    if (isRelative(quad.subject.value)) {
      if (!mappedTerms.has(quad.subject.value)) {
        mappedTerms.set(quad.subject.value, rdf.blankNode())
      }

      const subject = mappedTerms.get(quad.subject.value)

      return rdf.quad(subject, quad.predicate, quad.object, quad.graph)
    }

    return quad
  }))
}

function rebaseNamedNode (dataset, base) {
  return rdf.dataset([...dataset].map(quad => {
    if (isRelative(quad.subject.value)) {
      return rdf.quad(rdf.namedNode(resolve(base.value, quad.subject.value)), quad.predicate, quad.object, quad.graph)
    }

    return quad
  }))
}

function rebase (dataset, base) {
  if (base.termType === 'BlankNode') {
    return rebaseBlankNode(dataset, base)
  }

  if (base.termType === 'NamedNode') {
    return rebaseNamedNode(dataset, base)
  }

  throw new Error(`${base.termType} not supported for rebasing`)
}

module.exports = rebase
