import type { AnyPointer, GraphPointer } from 'clownface'
import type { DatasetCore, NamedNode } from '@rdfjs/types'
import type { KopflosEnvironment } from './env/index.js'
import type { Kopflos, KopflosResponse, Body, Query } from './Kopflos.js'
import type { ResourceShapeMatch } from './resourceShape.js'
import type { HttpMethod } from './httpMethods.js'
import { logCode } from './log.js'

type Dataset = ReturnType<KopflosEnvironment['dataset']>

export interface HandlerArgs<D extends DatasetCore = Dataset> {
  resourceShape: GraphPointer<NamedNode, D>
  env: KopflosEnvironment
  subject: GraphPointer<NamedNode, D>
  property: NamedNode | undefined
  object: GraphPointer<NamedNode, D> | undefined
  body: Body<D> | undefined
  query: Query
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
    const handlerMethods = path.out(env.ns.kopflos.method).values.map(v => v.toUpperCase())

    return handlerMethods.some(handlerMethod => {
      return handlerMethod === requestMethod ||
        (handlerMethod === 'GET' && requestMethod === 'HEAD' && !headHandlerExists(pointers))
    })
  }
}
