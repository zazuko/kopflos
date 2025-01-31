import type { Kopflos, KopflosPlugin } from '@kopflos-cms/core'
import type { NamedNode } from '@rdfjs/types'
import { createDefaultShapes, createHandlers } from './lib/resourceShapes.js'

type ExtendingTerms = 'hydra#memberShape'
| 'hydra#MemberAssertionConstraintComponent'
| 'hydra'
| 'hydra#DefaultCollectionShape'
| 'hydra#memberUriTemplate'

declare module '@kopflos-cms/core/ns.js' {
  interface KopflosTerms extends Record<ExtendingTerms, never> {
  }
}

export interface Options {
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

export default (options : Options): KopflosPlugin => {
  return {
    async onStart(instance: Kopflos) {
      const { env } = instance
      const { kopflos: kl } = env.ns

      const dataset = createDefaultShapes(env, options)

      await env.sparql.default.stream.store.put(dataset.toStream(), {
        graph: kl.hydra,
      })
    },
    async apiTriples(instance) {
      return createHandlers(instance)
    },
  }
}
