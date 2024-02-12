import rdf from '@zazuko/env-node'
import EcmaScriptLoader from 'rdf-loader-code/ecmaScript.js'
import LoaderRegistry from 'rdf-loaders-registry'
import EcmaScriptModuleLoader from 'rdf-loader-code/ecmaScriptModule.js'
import EcmaScriptLiteralLoader from 'rdf-loader-code/ecmaScriptLiteral.js'
import { replaceDatasetIRI } from './lib/replaceIRI.js'

class Api {
  constructor({ term, dataset, graph, path, codePath } = {}) {
    this.term = term
    this.dataset = dataset
    this.graph = graph
    this.path = path
    this.codePath = codePath
    this.loaderRegistry = new LoaderRegistry()
    this.tasks = []
    this.initialized = false

    EcmaScriptLoader.register(this.loaderRegistry)
    EcmaScriptModuleLoader.register(this.loaderRegistry)
    EcmaScriptLiteralLoader.register(this.loaderRegistry)
  }

  async init() {
    if (!this._initialization) {
      this._initialization = this._beginInit()
    }

    return this._initialization
  }

  fromFile(filePath) {
    this.tasks.push(async () => {
      this.dataset.addAll(await rdf.dataset().import(rdf.fromFile(filePath)))
    })

    return this
  }

  rebase(fromBaseIRI, toBaseIRI) {
    this.tasks.push(async () => {
      this.dataset = replaceDatasetIRI(fromBaseIRI, toBaseIRI, this.dataset)
    })

    return this
  }

  static fromFile(filePath, options) {
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

      apiDoc.node().has(rdf.ns.rdf.type, rdf.ns.hydra.Class).forEach(supportedClass => {
        apiDoc.addOut(rdf.ns.hydra.supportedClass, supportedClass)
      })
    }
  }
}

export default Api
