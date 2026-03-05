import type { NamespaceBuilder } from '@rdfjs/namespace'
import type { NamespaceFactory } from '@rdfjs/namespace/Factory.js'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type { DataFactory, NamedNode } from '@rdfjs/types'
import type { KopflosConfig } from '../Kopflos.js'

export interface KopflosFactory {
  readonly kopflos: {
    readonly api: NamedNode
    readonly config: KopflosConfig
    readonly variables: Record<string, unknown>
    readonly appNs: NamespaceBuilder
  }
}

export default (config: KopflosConfig, basePath: string) => {
  const variables = config.variables || {}
  let parent: Environment<NamespaceFactory | DataFactory> | undefined

  return class implements KopflosFactory {
    init(this: Environment<NamespaceFactory | DataFactory>) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      parent = this
    }

    get kopflos() {
      const appNs = parent!.namespace(config.baseIri)
      return {
        basePath,
        buildDir: config.buildDir || 'dist',
        config: Object.freeze(config),
        variables,
        appNs,
        api: appNs(config.apiPath),
      }
    }

    static exports = ['kopflos']
  }
}
