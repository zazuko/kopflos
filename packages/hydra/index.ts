import type { Kopflos, KopflosEnvironment, KopflosPlugin } from '@kopflos-cms/core'
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
  createHydraEnv(instance: Kopflos): DerivedEnvironment<Environment<RdfineFactory | HydraFactory>, KopflosEnvironment>
  readonly partialCollectionStrategies: PartialCollectionStrategy[]
}

declare module '@kopflos-cms/core' {
  interface Plugins {
    hydra: HydraPlugin
  }
}

export default class implements HydraPlugin {
  readonly name = 'hydra'

  private env: DerivedEnvironment<Environment<RdfineFactory | HydraFactory>, KopflosEnvironment> | undefined
  readonly partialCollectionStrategies: PartialCollectionStrategy[]

  constructor(private readonly options: Options) {
    this.partialCollectionStrategies = [
      ...this.options.partialCollectionStrategies ?? [],
      limitOffsetStrategy,
      pageIndexStrategy,
    ]
  }

  createHydraEnv(instance: Kopflos): DerivedEnvironment<Environment<RdfineFactory | HydraFactory>, KopflosEnvironment> {
    if (!this.env) {
      this.env = new E([RdfineFactory, HydraFactory], { parent: instance.env })
    }

    return this.env
  }

  async onStart(instance: Kopflos) {
    const env = this.createHydraEnv(instance)

    const { kopflos: kl } = env.ns

    const dataset = createDefaultShapes(env, this.options)

    await env.sparql.default.stream.store.put(dataset.toStream(), {
      graph: kl.hydra,
    })
  }

  async apiTriples(instance: Kopflos) {
    return createHandlers(instance)
  }
}
