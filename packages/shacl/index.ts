import type { HandlerArgs, Kopflos, KopflosPlugin } from '@kopflos-cms/core'
import type { DatasetCore } from '@rdfjs/types'

export type { ShapesGraphLoader } from './lib/shapes.js'

export interface Options {
  loadDataGraph?(arg: HandlerArgs & {
    shapesGraph: DatasetCore
  }): Promise<DatasetCore>
}

export interface ShaclPlugin extends KopflosPlugin {
  readonly options: Options
}

declare module '@kopflos-cms/core' {
  interface PluginConfig {
    '@kopflos-cms/shacl'?: Options
  }

  interface Plugins {
    '@kopflos-cms/shacl': ShaclPlugin
  }
}

const decoratorModule = new URL('./lib/decorator.js#default', import.meta.url).toString()

export default class implements ShaclPlugin {
  public readonly options

  public readonly name = '@kopflos-cms/shacl'

  constructor(options: Options = {}) {
    this.options = Object.freeze(options)
  }

  async apiTriples(instance: Kopflos) {
    const { env } = instance

    const apis = env.clownface()
      .node(instance.apis)

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
