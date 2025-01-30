import type { DatasetCore } from '@rdfjs/types'
import { kl } from '../ns.js'
import type { Kopflos, KopflosResponse, ResultEnvelope } from './Kopflos.js'
import type { HandlerArgs } from './handler.js'
import log from './log.js'

export interface RequestDecorator {
  applicable?: (args: HandlerArgs) => boolean
  (args: HandlerArgs, next: () => Promise<ResultEnvelope>): Promise<KopflosResponse> | KopflosResponse
}

export interface DecoratorLookup {
  (kopflos: Kopflos, args: HandlerArgs): Promise<RequestDecorator[]>
}

export const loadDecorators = async ({ env, apis }: Pick<Kopflos<DatasetCore>, 'env' | 'apis'>, args: HandlerArgs) => {
  const api = apis.node(args.resourceShape.out(kl.api))

  const decorators = api.out(kl.decorator)

  const loaded = await Promise.all(decorators.map(async decorator => {
    const implNode = decorator.out(env.ns.code.implementedBy)
    const impl = await env.load<RequestDecorator>(implNode)
    if (!impl) {
      log.warn('Decorator has no implementation')
    }
    if (!impl?.applicable || impl.applicable(args)) {
      return impl
    }
  }))

  return loaded.filter(Boolean) as RequestDecorator[]
}
