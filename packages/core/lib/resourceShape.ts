import type { NamedNode } from '@rdfjs/types'
import type { Kopflos, KopflosResponse } from './Kopflos.js'

interface ResourceShapeDirectMatch {
  api: NamedNode
  resourceShape: NamedNode
}

interface ResourceShapeTypeMatch {
  api: NamedNode
  resourceShape: NamedNode
  type: NamedNode
}

interface ResourceShapeObjectMatch {
  api: NamedNode
  resourceShape: NamedNode
  property: NamedNode
  subject: NamedNode
}

export type ResourceShapeMatch = ResourceShapeDirectMatch | ResourceShapeTypeMatch | ResourceShapeObjectMatch

export interface ResourceShapeLookup {
  (iri: NamedNode, instance: Kopflos): Promise<ResourceShapeMatch[] | KopflosResponse>
}

export default async function () {
  return new Error('Not implemented')
}
