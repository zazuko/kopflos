import type { Kopflos, KopflosPlugin } from '@kopflos-cms/core'
import type { NamedNode } from '@rdfjs/types'
import { hasHandler } from './lib/resourceShapes.js'

const getHandlerPath = new URL('./handlers/collection.js#get', import.meta.url).toString()

type ExtendingTerms = 'hydra#memberShape'
| 'hydra#MemberAssertionConstraintComponent'
| 'hydra'
| 'hydra#DefaultCollectionShape'

declare module '@kopflos-cms/core/ns.js' {
  interface KopflosTerms extends Record<ExtendingTerms, never> {
  }
}

interface Options {
  /**
   * The IRI of the API that the Hydra API Documentation will be generated and served for
   */
  apis: Array<NamedNode | string>
}

declare module '@kopflos-cms/core' {
  interface PluginConfig {
    '@kopflos-cms/hydra'?: Options
  }
}

export default ({ apis } : Options): KopflosPlugin => {
  return {
    async onStart(instance: Kopflos) {
      const { env } = instance
      const { rdf, kopflos: kl, sh, hydra } = env.ns

      // create default collection shape
      const data = env.clownface()
      data.node(kl('hydra#DefaultCollectionShape'))
        .addOut(rdf.type, kl.ResourceShape)
        .addOut(sh.targetClass, hydra.Collection)
        .addOut(kl.api, data.namedNode(apis))

      await instance.env.sparql.default.stream.store.put(data.dataset.toStream(), {
        graph: kl.hydra,
      })
    },
    async apiTriples(instance) {
      const { env } = instance
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
        .clownface({ dataset: instance.dataset })
        .has(rdf.type, kl.ResourceShape)
        .has(sh.targetClass, hydra.Collection)
        .toArray()

      for (const shape of [...defaultShapes, ...userShapes]) {
        if (!hasHandler(env, shape, 'get')) {
          apiTriples.node(shape).addOut(kl.handler, handler => {
            handler
              .addOut(rdf.type, kl.Handler)
              .addOut(kl.method, 'GET')
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
