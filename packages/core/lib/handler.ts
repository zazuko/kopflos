import type { AnyPointer, GraphPointer } from 'clownface'
import type { KopflosEnvironment } from './env/index.js'
import type { Kopflos, KopflosResponse } from './Kopflos.js'
import type { ResourceShapeMatch } from './resourceShape.js'

export interface Handler {
  (arg: {
    resourceShape: GraphPointer
    env: KopflosEnvironment
    resource: GraphPointer
    root: GraphPointer | undefined
  }): KopflosResponse | Promise<KopflosResponse>
}

export interface HandlerLookup {
  (match: ResourceShapeMatch, kopflos: Kopflos): Promise<Handler | undefined>
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
