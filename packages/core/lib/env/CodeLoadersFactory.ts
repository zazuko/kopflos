import type { AnyPointer } from 'clownface'
import LoaderRegistry from 'rdf-loaders-registry'
import cjsLoader from 'rdf-loader-code/ecmaScript.js'
import esmLoader from 'rdf-loader-code/ecmaScriptModule.js'
import { isGraphPointer } from 'is-graph-pointer'

export class CodeLoadersFactory {
  private registry!: LoaderRegistry

  init() {
    this.registry = new LoaderRegistry()
    esmLoader.register(this.registry)
    cjsLoader.register(this.registry)
  }

  load<T>(code: AnyPointer): Promise<T> | T | undefined {
    if (!isGraphPointer(code)) {
      return undefined
    }

    return this.registry.load<T>(code)
  }

  static exports = ['load']
}
