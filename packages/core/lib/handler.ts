import type { AnyPointer, GraphPointer } from 'clownface'
import type { NamedNode } from '@rdfjs/types'
import type { KopflosEnvironment } from './env/index.js'
import type { Kopflos, KopflosResponse } from './Kopflos.js'
import type { ResourceShapeMatch } from './resourceShape.js'
import type { HttpMethod } from './httpMethods.js'
import { logCode } from './log.js'

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
  (match: ResourceShapeMatch, method: HttpMethod, kopflos: Kopflos): Promise<Handler | undefined> | Handler | undefined
}

export function loadHandler({ resourceShape, ...rest }: ResourceShapeMatch, method: HttpMethod, { apis, env }: Kopflos) {
  const api = apis.node(rest.api)

  let shape: AnyPointer = api.node(resourceShape)

  if ('property' in rest) {
    shape = shape
      .out(env.ns.sh.property)
      .filter(path => rest.property.equals(path.out(env.ns.sh.path).term))
  }

  const handler = shape
    .out(env.ns.kopflos.handler)
    .filter(matchingMethod(env, method))

  const impl = handler.out(env.ns.code.implementedBy)
  logCode(impl, 'handler')
  return env.load<Handler>(impl)
}

function matchingMethod(env: KopflosEnvironment, requestMethod: HttpMethod): Parameters<AnyPointer['filter']>[0] {
  function headHandlerExists(pointers: GraphPointer[]) {
    return pointers.some(p => p.out(env.ns.kopflos.method).value === 'HEAD')
  }

  return (path: GraphPointer, _, pointers) => {
    const handlerMethod = path.out(env.ns.kopflos.method).value?.toUpperCase()

    return handlerMethod === requestMethod ||
      (handlerMethod === 'GET' && requestMethod === 'HEAD' && !headHandlerExists(pointers))
  }
}
