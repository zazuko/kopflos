import type { GraphPointer } from 'clownface'
import type { Kopflos, KopflosEnvironment } from '@kopflos-cms/core'
import type { Options } from '../index.js'

export function createDefaultShapes(env: KopflosEnvironment, { apis }: Options) {
  const { rdf, kopflos: kl, sh, hydra } = env.ns

  // create default collection shape
  const data = env.clownface()
  data.node(kl('hydra#DefaultCollectionShape'))
    .addOut(rdf.type, kl.ResourceShape)
    .addOut(sh.targetClass, hydra.Collection)
    .addOut(kl.api, data.namedNode(apis))

  return data.dataset
}

const getHandlerPath = (method: string) => new URL(`../handlers/collection.js#${method}`, import.meta.url).toString()

export async function createHandlers({ env, dataset }: Kopflos) {
  const { rdf, kopflos: kl, sh, hydra, code } = env.ns

  const hydraGraph = env.sparql.default.stream.store.get(kl.hydra)
  const apiTriples = env.clownface({
    dataset: await env.dataset().import(hydraGraph),
  })

  const defaultShapes = apiTriples
    .has(rdf.type, kl.ResourceShape)
    .has(sh.targetClass, hydra.Collection)
    .toArray()
  const userShapes = env
    .clownface({ dataset })
    .has(rdf.type, kl.ResourceShape)
    .has(sh.targetClass, hydra.Collection)
    .toArray()

  function addMissingHandler(shape: GraphPointer, method: 'get' | 'post') {
    if (!hasHandler(env, shape, method)) {
      apiTriples.node(shape.term).addOut(kl.handler, handler => {
        handler
          .addOut(rdf.type, kl.Handler)
          .addOut(kl.method, method.toUpperCase())
          .addOut(code.implementedBy, impl => {
            impl
              .addOut(rdf.type, code.EcmaScriptModule)
              .addOut(code.link, env.namedNode(getHandlerPath(method)))
          })
      })
    }
  }

  for (const shape of [...defaultShapes, ...userShapes]) {
    addMissingHandler(shape, 'get')
    addMissingHandler(shape, 'post')
  }

  return apiTriples.dataset
}

export function hasHandler(env: KopflosEnvironment, shape: GraphPointer, method: string): boolean {
  const methods = shape.out(env.ns.kopflos.handler).out(env.ns.kopflos.method).values

  return methods.some(m => m.toUpperCase() === method.toUpperCase())
}
