import type { KopflosPlugin } from '@kopflos-cms/core'
import { hasHandler, isReadOnly } from './lib/resourceShapes.js'

const getHandlerPath = new URL('./handlers/collection.js#get', import.meta.url).toString()

type ExtendingTerms = 'memberShape'
| 'HydraMemberAssertionConstraintComponent'

declare module '@kopflos-cms/core/ns.js' {
  interface KopflosTerms extends Record<ExtendingTerms, never> {
  }
}

export default (): KopflosPlugin => {
  return {
    async apiTriples(instance) {
      const { env } = instance
      const { rdf, kopflos, sh, hydra, code } = env.ns

      const apiTriples = env.clownface()
      const shapes = env
        .clownface({ dataset: instance.dataset })
        .has(rdf.type, kopflos.ResourceShape)
        .has(sh.targetClass, hydra.Collection)

      for (const shape of shapes.toArray()) {
        if (!hasHandler(env, shape, 'get') && !isReadOnly(env, shape)) {
          apiTriples.node(shape).addOut(kopflos.handler, handler => {
            handler
              .addOut(rdf.type, kopflos.Handler)
              .addOut(kopflos.method, 'GET')
              .addOut(code.implementedBy, impl => {
                impl
                  .addOut(rdf.type, code.EcmaScriptModule)
                  .addOut(code.link, env.namedNode(getHandlerPath))
              })
          })
        }
      }

      return apiTriples.dataset
    },
  }
}
