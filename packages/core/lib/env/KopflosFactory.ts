import type { NamespaceBuilder } from '@rdfjs/namespace'
import type { NamespaceFactory } from '@rdfjs/namespace/Factory.js'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type { KopflosConfig } from '../Kopflos.js'

export interface KopflosFactory {
  readonly kopflos: {
    readonly config: KopflosConfig
    readonly variables: Record<string, unknown>
    readonly appNs: NamespaceBuilder
  }
}

export default (config: KopflosConfig, basePath: string) => {
  const variables = config.variables || {}
  let parent: Environment<NamespaceFactory> | undefined

  return class implements KopflosFactory {
    init(this: Environment<NamespaceFactory>) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      parent = this
    }

    get kopflos() {
      return {
        basePath,
        buildDir: config.buildDir || 'dist',
        config: Object.freeze(config),
        variables,
        appNs: parent!.namespace(config.baseIri),
      }
    }

    static exports = ['kopflos']
  }
}
