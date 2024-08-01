import type { NamespaceBuilder } from '@rdfjs/namespace'
import type { NamespaceFactory } from '@rdfjs/namespace/Factory.js'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'

type KopflosTerms = 'api' | 'Config'

declare module '@tpluscode/rdf-ns-builders' {
  interface CustomNamespaces {
    kopflos: NamespaceBuilder<KopflosTerms>
  }
}

export class KopflosNamespaceFactory {
  init(this: Environment<NamespaceFactory | NsBuildersFactory>) {
    this.ns = {
      ...this.ns,
      kopflos: this.namespace('https://kopflos.described.at/'),
    }
  }
}
