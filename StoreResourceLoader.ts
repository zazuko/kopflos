import type { NamedNode, Store } from '@rdfjs/types'
import rdf from '@zazuko/env-node'
import { isNamedNode } from 'is-graph-pointer'
import { PropertyResource, Resource, ResourceLoader } from './index.js'

export default class StoreResourceLoader implements ResourceLoader {
  readonly store: Store

  constructor({ store }: { store: Store }) {
    this.store = store
  }

  async load(term: NamedNode): Promise<Resource | null> {
    const dataset = await rdf.dataset().import(this.store.match(null, null, null, term))

    if (dataset.size === 0) {
      return null
    }

    const types = rdf.clownface({ dataset, term })
      .out(rdf.ns.rdf.type)
      .filter(isNamedNode)

    return {
      term,
      prefetchDataset: dataset,
      async dataset() {
        return dataset
      },
      quadStream() {
        return dataset.toStream()
      },
      types: rdf.termSet(types.terms),
    }
  }

  async forClassOperation(term: NamedNode) {
    const resource = await this.load(term)

    return resource ? [resource] : []
  }

  async forPropertyOperation(term: NamedNode): Promise<PropertyResource[]> {
    const dataset = await rdf.dataset().import(this.store.match(null, null, term, null))
    const result: PropertyResource[] = []

    for (const quad of dataset) {
      if (quad.subject.termType !== 'NamedNode') continue
      if (quad.object.termType !== 'NamedNode') continue

      const loaded = await this.load(quad.subject)
      if (!loaded) continue

      result.push({
        property: quad.predicate,
        object: quad.object,
        ...loaded,
      })
    }

    return result
  }
}
