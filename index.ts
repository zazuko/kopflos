import type { Readable } from 'stream'
import type * as RDF from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import type { Request } from 'express'
import type { Dataset } from '@zazuko/env/lib/Dataset.js'
import middleware from './middleware.js'
import Api from './Api.js'

export interface Resource {
  term: RDF.NamedNode
  prefetchDataset: RDF.DatasetCore
  dataset(): Promise<Dataset>
  quadStream(): RDF.Stream & Readable
  types: Set<RDF.NamedNode>
}

export interface PropertyResource extends Resource {
  property: RDF.Quad_Predicate
  object: RDF.NamedNode
}

export interface PotentialOperation {
  resource: Resource | PropertyResource
  operation: GraphPointer
}

export interface HydraBox {
  api: Api
  term: RDF.NamedNode
  store: RDF.Store
  resource: Resource & { clownface(): Promise<GraphPointer<RDF.NamedNode, Dataset>> }
  operation: GraphPointer
  operations: PotentialOperation[]
}

export interface ResourceLoader {
  forClassOperation(term: RDF.NamedNode, req: Request): Promise<Resource[]>
  forPropertyOperation(term: RDF.NamedNode, req: Request): Promise<PropertyResource[]>
}

export default {
  middleware,
  Api,
}
