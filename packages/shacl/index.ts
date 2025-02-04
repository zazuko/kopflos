import type { Kopflos, KopflosPlugin, KopflosPluginConstructor } from '@kopflos-cms/core'

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
    constructor(private readonly instance: Kopflos) {
    }

    async apiTriples() {
      const { env } = this.instance

      const apis = env.clownface()
        .node(this.instance.apis)

      const impl = apis.blankNode()
        .addOut(env.ns.rdf.type, env.ns.code.EcmaScriptModule)
        .addOut(env.ns.code.link, env.namedNode(decoratorModule))

      apis
        .addOut(env.ns.kl.decorator, decorator => {
          decorator.addOut(env.ns.code.implementedBy, impl)
        })

      return apis.dataset
    }
  }
}
