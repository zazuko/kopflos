import rdf from '@zazuko/env-node'

export default class StoreResourceLoader {
  constructor({ store }) {
    this.store = store
  }

  async load(term) {
    const dataset = await rdf.dataset().import(this.store.match(null, null, null, term))

    if (dataset.size === 0) {
      return null
    }

    const types = rdf.termSet(rdf.clownface({ dataset, term }).out(rdf.ns.rdf.type).terms)

    return {
      term,
      prefetchDataset: dataset,
      async dataset() {
        return dataset
      },
      quadStream() {
        return dataset.toStream()
      },
      types,
    }
  }

  async forClassOperation(term) {
    const resource = await this.load(term)

    return resource ? [resource] : []
  }

  async forPropertyOperation(term) {
    const dataset = await rdf.dataset().import(this.store.match(null, null, term, null))
    const result = []

    for (const quad of dataset) {
      result.push({
        property: quad.predicate,
        object: quad.object,
        ...await this.load(quad.subject),
      })
    }

    return result
  }
}
