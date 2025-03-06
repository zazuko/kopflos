import type { GraphPointer } from 'clownface'
import { kl } from '../ns.js'
import type { Kopflos, KopflosResponse, ResultEnvelope } from './Kopflos.js'
import type { HandlerArgs } from './handler.js'
import log from './log.js'
import type { KopflosEnvironment } from './env/index.js'

export interface DecoratorCallback {
  (): Promise<ResultEnvelope>
}

export interface RequestDecorator {
  applicable?: (args: HandlerArgs) => boolean | Promise<boolean>
  run(args: HandlerArgs, next: DecoratorCallback): Promise<KopflosResponse> | KopflosResponse
}

export interface RequestDecoratorConstructor {
  new(instance: Kopflos): RequestDecorator
}

interface DecoratorLookupArgs {
  api: GraphPointer
  env: KopflosEnvironment
}

export interface DecoratorLookup {
  (arg: DecoratorLookupArgs): Promise<RequestDecoratorConstructor[]>
}

export const loadDecorators = async function ({ api, env }: DecoratorLookupArgs) {
  const decorators = api.out(kl.decorator)

  const loaded = await Promise.all(decorators.map(async decorator => {
    const implNode = decorator.out(env.ns.code.implementedBy)
    const impl = await env.load<RequestDecoratorConstructor>(implNode)
    if (!impl) {
      log.warn('Decorator has no implementation')
    }

    return impl
  }))

  return loaded.filter(Boolean) as RequestDecoratorConstructor[]
}
