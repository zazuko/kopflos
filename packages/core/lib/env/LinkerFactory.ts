import type { NamedNode } from '@rdfjs/types'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type { KopflosNamespaceFactory } from './KopflosNamespaceFactory.js'
import type { KopflosFactory } from './KopflosFactory.js'

export interface Linker {
  (iri: NamedNode): string
}

export interface LinkerFactory {
  linker: Linker
}

export class LinkerFactoryImpl implements LinkerFactory {
  linker!: Linker

  init(this: Environment<LinkerFactory | KopflosNamespaceFactory | KopflosFactory>) {
    this.linker = (iri: NamedNode) => {
      if (iri.value.startsWith(this.kopflos.config.baseIri)) {
        return iri.value.substring(this.kopflos.config.baseIri.length)
      }

      return iri.value
    }
  }
}
