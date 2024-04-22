/* eslint-disable camelcase */
import EcmaScriptLoader from 'rdf-loader-code/ecmaScript.js'
import LoaderRegistryImpl, { LoaderRegistry } from 'rdf-loaders-registry'
import EcmaScriptModuleLoader from 'rdf-loader-code/ecmaScriptModule.js'
import EcmaScriptLiteralLoader from 'rdf-loader-code/ecmaScriptLiteral.js'
import type { NamedNode, Quad_Graph } from '@rdfjs/types'
import addAll from 'rdf-dataset-ext/addAll.js'
import fromStream from 'rdf-dataset-ext/fromStream.js'
import { replaceDatasetIRI } from './lib/replaceIRI.js'
import Factory, { ExtractDataset } from './lib/factory.js'

export interface ApiInit<E extends Factory = Factory> {
  term?: NamedNode
  dataset?: ExtractDataset<E>
  graph?: NamedNode
  path?: string
  codePath?: string
  factory: E
}

export interface Api<E extends Factory = Factory> {
  env: E
  initialized: boolean
  path: string
  codePath: string
  graph?: Quad_Graph | undefined
  dataset: ExtractDataset<E>
  term: NamedNode | undefined
  loaderRegistry: LoaderRegistry
  init(): Promise<void>
}

export default class Impl<E extends Factory = Factory> implements Api<E> {
  initialized: boolean
  path: string
  codePath: string
  graph?: Quad_Graph | undefined
  dataset: ExtractDataset<E>
  private _term: NamedNode | undefined
  loaderRegistry: LoaderRegistry
  private _initialization?: Promise<void>
  readonly tasks: Array<() => Promise<void>>
  readonly env: E

  constructor({ term, dataset, graph, path = '/api', codePath = process.cwd(), factory }: ApiInit<E>) {
    this._term = term
    this.env = factory
    this.dataset = (dataset || factory.dataset()) as unknown as ExtractDataset<E>
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
      addAll(this.dataset, await fromStream(this.env.dataset(), this.env.fromFile(filePath)))
    })

    return this
  }

  rebase(fromBaseIRI: string | NamedNode, toBaseIRI: string | NamedNode) {
    this.tasks.push(async () => {
      this.dataset = replaceDatasetIRI(fromBaseIRI, toBaseIRI, this.dataset, this.env)
    })

    return this
  }

  static fromFile(filePath: string, options: ApiInit) {
    const api = new Impl(options)

    return api.fromFile(filePath)
  }

  async _beginInit() {
    if (!this.dataset) {
      this.dataset = this.env.dataset() as unknown as ExtractDataset<E>
    }

    for (const task of this.tasks) {
      await task()
    }

    const apiDoc = this.env.clownface({ dataset: this.dataset, term: this.term, graph: this.graph })

    if (apiDoc.has(this.env.ns.rdf.type, this.env.ns.hydra.ApiDocumentation).terms.length === 0) {
      apiDoc.addOut(this.env.ns.rdf.type, this.env.ns.hydra.ApiDocumentation)

      apiDoc.any().has(this.env.ns.rdf.type, this.env.ns.hydra.Class).forEach(supportedClass => {
        apiDoc.addOut(this.env.ns.hydra.supportedClass, supportedClass)
      })
    }
  }
}
