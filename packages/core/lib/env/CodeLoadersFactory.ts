import type { AnyPointer } from 'clownface'
import LoaderRegistry from 'rdf-loaders-registry'
import cjsLoader from 'rdf-loader-code/ecmaScript.js'
import esmLoader from 'rdf-loader-code/ecmaScriptModule.js'
import { isGraphPointer } from 'is-graph-pointer'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type { KopflosFactory } from './KopflosFactory.js'

export class CodeLoadersFactory {
  private registry!: LoaderRegistry
  private codeBase!: string

  init(this: CodeLoadersFactory & Environment<KopflosFactory>) {
    this.codeBase = this.kopflos.config.codeBase || process.cwd()
    this.registry = new LoaderRegistry()
    esmLoader.register(this.registry)
    cjsLoader.register(this.registry)
  }

  load<T>(code: AnyPointer): Promise<T> | T | undefined {
    if (!isGraphPointer(code)) {
      return undefined
    }

    return this.registry.load<T>(code, {
      basePath: this.codeBase,
    })
  }

  static exports = ['load']
}
