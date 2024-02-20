/* eslint-disable camelcase */
import rdf from '@zazuko/env-node'
import EcmaScriptLoader from 'rdf-loader-code/ecmaScript.js'
import LoaderRegistryImpl, { LoaderRegistry } from 'rdf-loaders-registry'
import EcmaScriptModuleLoader from 'rdf-loader-code/ecmaScriptModule.js'
import EcmaScriptLiteralLoader from 'rdf-loader-code/ecmaScriptLiteral.js'
import type { NamedNode, DatasetCore, Quad_Graph } from '@rdfjs/types'
import { replaceDatasetIRI } from './lib/replaceIRI.js'

interface ApiInit<D extends DatasetCore = DatasetCore> {
  term?: NamedNode
  dataset?: D
  graph?: NamedNode
  path?: string
  codePath?: string
}

class Api {
  initialized: boolean
  path: string
  codePath: string
  graph?: Quad_Graph | undefined
  dataset: DatasetCore
  private _term: NamedNode | undefined
  loaderRegistry: LoaderRegistry
  private _initialization?: Promise<void>
  readonly tasks: Array<() => Promise<void>>

  constructor({ term, dataset, graph, path = '/api', codePath = process.cwd() }: ApiInit = { }) {
    this._term = term
    this.dataset = dataset || rdf.dataset()
    this.graph = graph
    this.path = path
    this.codePath = codePath
    this.loaderRegistry = new LoaderRegistryImpl()
    this.tasks = []
    this.initialized = false

    EcmaScriptLoader.register(this.loaderRegistry)
    EcmaScriptModuleLoader.register(this.loaderRegistry)
    EcmaScriptLiteralLoader.register(this.loaderRegistry)
  }

  get term() {
    return this._term!
  }

  set term(term: NamedNode) {
    this._term = term
  }

  async init() {
    if (!this._initialization) {
      this._initialization = this._beginInit()
    }

    return this._initialization
  }

  fromFile(filePath: string) {
    this.tasks.push(async () => {
      rdf.dataset().addAll.call(this.dataset, await rdf.dataset().import(rdf.fromFile(filePath)))
    })

    return this
  }

  rebase(fromBaseIRI: string | NamedNode, toBaseIRI: string | NamedNode) {
    this.tasks.push(async () => {
      this.dataset = replaceDatasetIRI(fromBaseIRI, toBaseIRI, this.dataset)
    })

    return this
  }

  static fromFile(filePath: string, options?: ApiInit) {
    const api = new Api(options)

    return api.fromFile(filePath)
  }

  async _beginInit() {
    if (!this.dataset) {
      this.dataset = rdf.dataset()
    }

    for (const task of this.tasks) {
      await task()
    }

    const apiDoc = rdf.clownface({ dataset: this.dataset, term: this.term, graph: this.graph })

    if (apiDoc.has(rdf.ns.rdf.type, rdf.ns.hydra.ApiDocumentation).terms.length === 0) {
      apiDoc.addOut(rdf.ns.rdf.type, rdf.ns.hydra.ApiDocumentation)

      apiDoc.any().has(rdf.ns.rdf.type, rdf.ns.hydra.Class).forEach(supportedClass => {
        apiDoc.addOut(rdf.ns.hydra.supportedClass, supportedClass)
      })
    }
  }
}

export default Api
