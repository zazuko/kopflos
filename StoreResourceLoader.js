const clownface = require('clownface')
const ns = require('@tpluscode/rdf-ns-builders')
const { fromStream, toStream } = require('rdf-dataset-ext')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const TermSet = require('@rdfjs/term-set')

class StoreResourceLoader {
  constructor ({ store }) {
    this.store = store
  }

  async load (term) {
    const dataset = await fromStream(rdf.dataset(), this.store.match(null, null, null, term))

    if (dataset.size === 0) {
      return null
    }

    const types = new TermSet(clownface({ dataset, term }).out(ns.rdf.type).terms)

    return {
      term,
      prefetchDataset: dataset,
      async dataset () {
        return dataset
      },
      quadStream () {
        return toStream(dataset)
      },
      types
    }
  }

  async forClassOperation (term) {
    const resource = await this.load(term)

    return resource ? [resource] : []
  }

  async forPropertyOperation (term) {
    const dataset = await fromStream(rdf.dataset(), this.store.match(null, null, term, null))
    const result = []

    for (const quad of dataset) {
      result.push({
        property: quad.predicate,
        object: quad.object,
        ...await this.load(quad.subject)
      })
    }

    return result
  }
}

module.exports = StoreResourceLoader
