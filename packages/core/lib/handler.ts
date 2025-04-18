import type { IncomingHttpHeaders } from 'node:http'
import type { AnyPointer, GraphPointer } from 'clownface'
import type { DatasetCore, NamedNode } from '@rdfjs/types'
import { isGraphPointer } from 'is-graph-pointer'
import loadArguments from 'rdf-loader-code/arguments.js'
import type { KopflosEnvironment } from './env/index.js'
import type { Kopflos, KopflosResponse, Body, Query, ResultEnvelope } from './Kopflos.js'
import type { ResourceShapeMatch } from './resourceShape.js'
import type { HttpMethod } from './httpMethods.js'
import { logCode } from './log.js'

type Dataset = ReturnType<KopflosEnvironment['dataset']>

export interface HandlerArgs<D extends DatasetCore = Dataset> {
  method: string
  resourceShape: GraphPointer<NamedNode, D>
  handler: GraphPointer
  env: KopflosEnvironment
  subject: GraphPointer<NamedNode, D>
  subjectVariables: Record<string, string>
  property: NamedNode | undefined
  object: GraphPointer<NamedNode, D> | undefined
  body: Body<D>
  query: Query
  headers: IncomingHttpHeaders
}

export interface SubjectHandler {
  (arg: HandlerArgs, response?: ResultEnvelope): KopflosResponse | Promise<KopflosResponse>
}

export interface ObjectHandler {
  (arg: Required<HandlerArgs>, response?: ResultEnvelope): KopflosResponse | Promise<KopflosResponse>
}

export type Handler = SubjectHandler | ObjectHandler

type HandlerFactory = (this: Kopflos, ...args: unknown[]) => Handler | Promise<Handler>

export interface HandlerLookup {
  (match: ResourceShapeMatch, method: HttpMethod, kopflos: Kopflos): {
    pointer: GraphPointer
    implementation: Array<Promise<Handler> | Handler>
  } | undefined
}

export const loadHandlers: HandlerLookup = ({ resourceShape, ...rest }: ResourceShapeMatch, method: HttpMethod, instance: Kopflos) => {
  const { apis, env } = instance
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

  if (!isGraphPointer(handler)) {
    return undefined
  }

  const vars = new Map(Object.entries(env.kopflos.variables))
  if ('subjectVariables' in rest) {
    for (const [k, v] of rest.subjectVariables) {
      vars.set(k, v)
    }
  }
  const createHandler = createHandlerFactory(instance, vars)

  const impl = handler.out(env.ns.code.implementedBy)
  if (impl.isList()) {
    const pointers = [...impl.list()]
    const implementation = pointers.map(chainedHandler => {
      logCode(chainedHandler, 'handler')
      return createHandler(chainedHandler)
    }).filter(Boolean) as Array<Promise<Handler>>

    return {
      pointer: handler,
      implementation,
    }
  }

  logCode(impl, 'handler')
  const loaded = createHandler(impl)
  if (loaded) {
    return {
      pointer: handler,
      implementation: [loaded],
    }
  }

  return {
    pointer: handler,
    implementation: [],
  }
}

function createHandlerFactory(instance: Kopflos, variables: Map<string, unknown>) {
  const { env } = instance
  return (impl: AnyPointer): Promise<Handler> | undefined => {
    const factory = env.load<HandlerFactory>(impl)
    if (!factory) {
      return
    }

    let promise: Promise<HandlerFactory>
    if (typeof factory === 'function') {
      promise = Promise.resolve(factory)
    } else {
      promise = factory
    }

    return promise.then(async factory => {
      if (isGraphPointer(impl) && isGraphPointer(impl.out(env.ns.code.arguments))) {
        const args = await loadArguments(impl, {
          variables,
          ...env.load.options,
        })
        return factory?.call(instance, ...args)
      }

      return factory?.call(instance)
    })
  }
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
