import type { DatasetCore, NamedNode, Store } from '@rdfjs/types'
import { isNamedNode } from 'is-graph-pointer'
import fromStream from 'rdf-dataset-ext/fromStream.js'
import toStream from 'rdf-dataset-ext/toStream.js'
import Factory from './lib/factory.js'
import { PropertyResource, Resource, ResourceLoader } from './index.js'

export default class StoreResourceLoader<D extends DatasetCore> implements ResourceLoader<D> {
  readonly store: Store
  private env: Factory<D>

  constructor({ store, env }: { store: Store; env: Factory<D> }) {
    this.store = store
    this.env = env
  }

  async load(term: NamedNode): Promise<Resource<D> | null> {
    const dataset = await fromStream(this.env.dataset(), this.store.match(null, null, null, term))

    if (dataset.size === 0) {
      return null
    }

    const types = this.env.clownface({ dataset, term })
      .out(this.env.ns.rdf.type)
      .filter(isNamedNode)

    return {
      term,
      prefetchDataset: dataset,
      async dataset() {
        return dataset
      },
      quadStream() {
        return toStream(dataset)
      },
      types: this.env.termSet(types.terms),
    }
  }

  async forClassOperation(term: NamedNode) {
    const resource = await this.load(term)

    return resource ? [resource] : []
  }

  async forPropertyOperation(term: NamedNode): Promise<PropertyResource<D>[]> {
    const dataset = await fromStream(this.env.dataset(), this.store.match(null, null, term, null))
    const result: PropertyResource<D>[] = []

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
