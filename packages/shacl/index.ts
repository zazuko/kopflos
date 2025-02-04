import type { Kopflos, KopflosEnvironment, KopflosPlugin, KopflosPluginConstructor } from '@kopflos-cms/core'
import type { MultiPointer } from 'clownface'

type ExtendingTerms = 'shacl#shapeSelector'

declare module '@kopflos-cms/core/ns.js' {
  interface KopflosTerms extends Record<ExtendingTerms, never> {
  }
}

export interface Options {
}

declare module '@kopflos-cms/core' {
  interface PluginConfig {
    '@kopflos-cms/shacl'?: Options
  }
}

const decoratorModule = new URL('./lib/decorator.js#decorator', import.meta.url).toString()

export default function (): KopflosPluginConstructor {
  return class implements KopflosPlugin {
    private env: KopflosEnvironment
    private apis: MultiPointer

    constructor(instance: Kopflos) {
      this.env = instance.env
      this.apis = instance.apis
    }

    async apiTriples() {
      const apis = this.env.clownface()
        .node(this.apis.terms)

      const impl = apis.blankNode()
        .addOut(this.env.ns.rdf.type, this.env.ns.code.EcmaScriptModule)
        .addOut(this.env.ns.code.link, this.env.namedNode(decoratorModule))

      apis
        .addOut(this.env.ns.kl.decorator, decorator => {
          decorator.addOut(this.env.ns.code.implementedBy, impl)
        })

      return apis.dataset
    }
  }
}
