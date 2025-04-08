import type { HandlerArgs, KopflosEnvironment } from '@kopflos-cms/core'
import { log } from '@kopflos-cms/core'
import type { DatasetCore, NamedNode } from '@rdfjs/types'
import { isNamedNode } from 'is-graph-pointer'
import loadArguments from 'rdf-loader-code/arguments.js'

export interface ShapesGraphLoader<A extends unknown[] = never[]> {
  (args: HandlerArgs, ...userArgs: A): Promise<DatasetCore> | DatasetCore
}

export async function loadShapesGraph(args: HandlerArgs): Promise<DatasetCore> {
  const { env, handler } = args

  const dataset = env.dataset()
  const loadImport = loadImportTo(env, dataset)

  const loadingGraphs = handler
    .out(env.ns.sh.shapesGraph)
    .map(async (ptr) => {
      if (isNamedNode(ptr)) {
        await loadImport(ptr.term)
        return
      }

      const impl = ptr.out(env.ns.code.implementedBy)
      const loader = await env.load<ShapesGraphLoader<unknown[]>>(impl)
      if (loader) {
        try {
          const userArgs = await loadArguments(ptr, env.load.options)

          env.dataset.addAll(dataset, await loader(args, ...userArgs))
        } catch (e) {
          log.error('Failed to load shapes graph', e)
          throw e
        }
      } else {
        throw new Error('Bad shapes graph loader implementation')
      }
    })

  await Promise.all(loadingGraphs)

  return dataset
}

export function loadImportTo(env: KopflosEnvironment, dataset = env.dataset()) {
  return (url: NamedNode) => {
    return dataset.import(env.sparql.default.stream.store.get(url))
  }
}
