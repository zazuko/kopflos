import type { NamespaceBuilder } from '@rdfjs/namespace'
import type { NamespaceFactory } from '@rdfjs/namespace/Factory.js'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import { code } from '@zazuko/vocabulary-extras-builders'

type Properties = 'api' | 'resourceLoader' | 'handler'
type Classes = 'Config' | 'Api'
type Shorthands = 'DescribeLoader' | 'OwnGraphLoader'

export type KopflosTerms = Properties | Classes | Shorthands

declare module '@tpluscode/rdf-ns-builders' {
  interface CustomNamespaces {
    kopflos: NamespaceBuilder<KopflosTerms>
    code: typeof code
  }
}

export class KopflosNamespaceFactory {
  init(this: Environment<NamespaceFactory | NsBuildersFactory>) {
    this.ns = {
      ...this.ns,
      kopflos: this.namespace('https://kopflos.described.at/'),
      code,
    }
  }
}
