import type { Kopflos, KopflosEnvironment, KopflosPlugin, KopflosPluginConstructor } from '@kopflos-cms/core'
import type { NamedNode } from '@rdfjs/types'
import type { DerivedEnvironment } from '@zazuko/env'
import E from '@zazuko/env/Environment.js'
import { RdfineFactory } from '@tpluscode/rdfine'
import { HydraFactory } from '@rdfine/hydra/Factory'
import type { Environment } from '@rdfjs/environment/Environment.js'
import { createDefaultShapes, createHandlers } from './lib/resourceShapes.js'
import type { PartialCollectionStrategy } from './lib/partialCollection/index.js'
import limitOffsetStrategy from './lib/partialCollection/limitOffsetStrategy.js'
import pageIndexStrategy from './lib/partialCollection/pageIndexStrategy.js'

type ExtendingTerms = 'hydra#memberShape'
| 'hydra#memberCreateShape'
| 'hydra#memberQueryShape'
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
  partialCollectionStrategies?: PartialCollectionStrategy[]
}

declare module '@kopflos-cms/core' {
  interface PluginConfig {
    '@kopflos-cms/hydra'?: Options
  }
}

export interface HydraPlugin extends KopflosPlugin {
  readonly env: DerivedEnvironment<Environment<RdfineFactory | HydraFactory>, KopflosEnvironment>
  readonly partialCollectionStrategies: PartialCollectionStrategy[]
}

declare module '@kopflos-cms/core' {
  interface Plugins {
    hydra: HydraPlugin
  }
}

export default (options : Options): KopflosPluginConstructor => {
  return class implements HydraPlugin {
    readonly name = 'hydra'

    readonly env: DerivedEnvironment<Environment<RdfineFactory | HydraFactory>, KopflosEnvironment>
    readonly partialCollectionStrategies: PartialCollectionStrategy[]

    constructor(private readonly instance: Kopflos) {
      this.env = new E([RdfineFactory, HydraFactory], { parent: instance.env })
      this.partialCollectionStrategies = [
        ...options.partialCollectionStrategies ?? [],
        limitOffsetStrategy,
        pageIndexStrategy,
      ]
    }

    async onStart() {
      const { kopflos: kl } = this.env.ns

      const dataset = createDefaultShapes(this.env, options)

      await this.env.sparql.default.stream.store.put(dataset.toStream(), {
        graph: kl.hydra,
      })
    }

    async apiTriples() {
      return createHandlers(this.instance)
    }
  }
}
