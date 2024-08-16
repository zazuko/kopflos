import type { AnyPointer, GraphPointer } from 'clownface'
import type { NamedNode } from '@rdfjs/types'
import type { KopflosEnvironment } from './env/index.js'
import type { Kopflos, KopflosResponse } from './Kopflos.js'
import type { ResourceShapeMatch } from './resourceShape.js'

export interface HandlerArgs {
  resourceShape: GraphPointer
  env: KopflosEnvironment
  subject: GraphPointer
  property: NamedNode | undefined
  object: GraphPointer | undefined
}

export interface SubjectHandler {
  (arg: HandlerArgs): KopflosResponse | Promise<KopflosResponse>
}

export interface ObjectHandler {
  (arg: Required<HandlerArgs>): KopflosResponse | Promise<KopflosResponse>
}

export type Handler = SubjectHandler | ObjectHandler

export interface HandlerLookup {
  (match: ResourceShapeMatch, kopflos: Kopflos): Promise<Handler | undefined> | Handler | undefined
}

export function loadHandler({ resourceShape, ...rest }: ResourceShapeMatch, { apis, env }: Kopflos) {
  const api = apis.node(rest.api)

  let handler: AnyPointer

  if ('property' in rest) {
    handler = api.node(resourceShape)
      .out(env.ns.sh.property)
      .filter(path => rest.property.equals(path.out(env.ns.sh.path).term))
      .out(env.ns.kopflos.handler)
      .out(env.ns.code.implementedBy)
  } else {
    handler = api
      .node(resourceShape)
      .out(env.ns.kopflos.handler)
      .out(env.ns.code.implementedBy)
  }

  return env.load<Handler>(handler)
}
