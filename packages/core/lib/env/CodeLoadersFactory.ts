import type { AnyPointer } from 'clownface'
import LoaderRegistry from 'rdf-loaders-registry'
import cjsLoader from 'rdf-loader-code/ecmaScript.js'
import esmLoader from 'rdf-loader-code/ecmaScriptModule.js'
import literalLoader from 'rdf-loader-code/ecmaScriptLiteral.js'
import { isGraphPointer } from 'is-graph-pointer'
import type { Environment } from '@rdfjs/environment/Environment.js'
import log from '../log.js'
import type { KopflosFactory } from './KopflosFactory.js'

interface Load {
  <T>(code: AnyPointer): Promise<T> | T | undefined
  options: {
    loaderRegistry: LoaderRegistry
    basePath: string
  }
}

export class CodeLoadersFactory {
  declare load: Load

  private registry!: LoaderRegistry
  private codeBase!: string

  init(this: CodeLoadersFactory & Environment<KopflosFactory>) {
    this.codeBase = this.kopflos.config.codeBase || process.cwd()
    this.registry = new LoaderRegistry()
    esmLoader.register(this.registry)
    cjsLoader.register(this.registry)
    literalLoader.register(this.registry)

    log.info(`Code loader initialized. Base code path: ${this.codeBase}`)

    const loadOptions = {
      loaderRegistry: this.registry,
      basePath: this.codeBase,
    }
    this.load = (<T>(code: AnyPointer): Promise<T> | T | undefined => {
      if (!isGraphPointer(code)) {
        return undefined
      }

      return this.registry.load<T>(code, loadOptions)
    }) as Load

    this.load.options = loadOptions
  }
}
