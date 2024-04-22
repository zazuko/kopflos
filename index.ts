import type * as RDF from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import type { Request } from 'express'
import type { Api } from './Api.js'
import Factory, { ExtractDataset } from './lib/factory.js'

export { default as middleware } from './middleware.js'
export { default as Api } from './Api.js'

export interface Resource<D extends RDF.DatasetCore = RDF.DatasetCore> {
  term: RDF.NamedNode
  prefetchDataset: RDF.DatasetCore
  dataset(): Promise<D>
  quadStream(): RDF.Stream
  types: Set<RDF.NamedNode>
}

export interface PropertyResource<D extends RDF.DatasetCore = RDF.DatasetCore> extends Resource<D> {
  property: RDF.Quad_Predicate
  object: RDF.NamedNode
}

export interface PotentialOperation<D extends RDF.DatasetCore = RDF.DatasetCore> {
  resource: Resource<D> | PropertyResource<D>
  operation: GraphPointer
}

export interface HydraBox<E extends Factory = Factory, D extends RDF.DatasetCore = ExtractDataset<E>> {
  api: Api<E>
  term: RDF.NamedNode
  store: RDF.Store
  resource: Resource<D> & { clownface(): Promise<GraphPointer<RDF.NamedNode, D>> }
  operation: GraphPointer
  operations: PotentialOperation<D>[]
}

export interface ResourceLoader<D extends RDF.DatasetCore = RDF.DatasetCore> {
  forClassOperation(term: RDF.NamedNode, req: Request): Promise<Resource<D>[]>
  forPropertyOperation(term: RDF.NamedNode, req: Request): Promise<PropertyResource<D>[]>
}
