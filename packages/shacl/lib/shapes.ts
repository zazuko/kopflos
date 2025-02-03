import type { HandlerArgs, KopflosEnvironment } from '@kopflos-cms/core'
import type { MultiPointer } from 'clownface'
import type { DatasetCore } from '@rdfjs/types'
import { isBlankNode, isGraphPointer } from 'is-graph-pointer'
import { clone } from './dataset.js'

export async function findShapes(args: HandlerArgs): Promise<MultiPointer> {
  const { env, resourceShape, method } = args

  const findShapePointer = args.resourceShape
    .out(env.ns.kl.handler)
    .filter(handler => handler.out(env.ns.kl.method).value?.toUpperCase() === method.toUpperCase())
    .out(env.ns.kl('shacl#shapeSelector'))
    .out(env.ns.code.implementedBy)
  if (isGraphPointer(findShapePointer)) {
    const loaded = await env.load<typeof defaultShapeSelector>(findShapePointer)
    if (!loaded) {
      throw new Error(`Failed to load shape selector for resource shape ${resourceShape.value}`)
    }

    return loaded(args)
  }

  return defaultShapeSelector(args)
}

function defaultShapeSelector({ env, resourceShape, method }: HandlerArgs): MultiPointer {
  return resourceShape
    .out(env.ns.kl.handler)
    .filter(handler => handler.out(env.ns.kl.method).value?.toUpperCase() === method.toUpperCase())
    .filter(handler => handler.out(env.ns.dash.shape).terms.length > 0)
}

export async function loadShapes(shapes: MultiPointer, env: KopflosEnvironment): Promise<DatasetCore> {
  const blankNodeShapes = clone(shapes.filter(isBlankNode), env)

  const dataset = env.dataset(blankNodeShapes)

  // TODO: load named node shapes from graphs

  return dataset
}
