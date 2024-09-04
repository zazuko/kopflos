import * as fs from 'node:fs'
import * as path from 'node:path'
import type { NamedNode } from '@rdfjs/types'
import type { Kopflos, KopflosResponse } from './Kopflos.js'

export interface ResourceShapeDirectMatch {
  api: NamedNode
  resourceShape: NamedNode
  subject: NamedNode
}

export interface ResourceShapeTypeMatch {
  api: NamedNode
  resourceShape: NamedNode
  subject: NamedNode
}

export interface ResourceShapeObjectMatch {
  api: NamedNode
  resourceShape: NamedNode
  subject: NamedNode
  property: NamedNode
  object: NamedNode
}

export type ResourceShapeMatch = ResourceShapeDirectMatch | ResourceShapeTypeMatch | ResourceShapeObjectMatch

export interface ResourceShapeLookup {
  (iri: NamedNode, instance: Kopflos): Promise<ResourceShapeMatch[] | KopflosResponse>
}

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const select = fs.readFileSync(path.resolve(__dirname, '../query/resourceShapes.rq')).toString()

export default async (iri: NamedNode, instance: Kopflos) => {
  return instance.env.sparql.default.parsed.query.select(
    select.replaceAll('sh:this', `<${iri.value}>`),
  ) as unknown as Promise<ResourceShapeMatch[]>
}
