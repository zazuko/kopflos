const clownface = require('clownface')
const { fromFile } = require('rdf-utils-fs')
const { addAll, fromStream } = require('rdf-dataset-ext')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const { replaceDatasetIRI } = require('./lib/replaceIRI')
const LoaderRegistry = require('rdf-loaders-registry')
const EcmaScriptLoader = require('rdf-loader-code/ecmaScript')
const EcmaScriptLiteralLoader = require('rdf-loader-code/ecmaScriptLiteral')
const ns = require('./lib/namespaces')

class Api {
  constructor ({ term, dataset, graph, path, codePath } = {}) {
    this.term = term
    this.dataset = dataset
    this.graph = graph
    this.path = path
    this.codePath = codePath
    this.loaderRegistry = new LoaderRegistry()
    this.initialized = false
    this.sources = []

    EcmaScriptLoader.register(this.loaderRegistry)
    EcmaScriptLiteralLoader.register(this.loaderRegistry)
  }

  async init () {
    if (this.initialized) {
      return
    }

    await Promise.all(this.sources)

    const apiDoc = clownface({ dataset: this.dataset, term: this.term, graph: this.graph })

    if (apiDoc.has(ns.rdf.type, ns.hydra.ApiDocumentation).terms.length === 0) {
      apiDoc.addOut(ns.rdf.type, ns.hydra.ApiDocumentation)

      apiDoc.node().has(ns.rdf.type, ns.hydra.Class).forEach(supportedClass => {
        apiDoc.addOut(ns.hydra.supportedClass, supportedClass)
      })
    }

    this.initialized = true
  }

  fromFile (filePath) {
    if (!this.dataset) {
      this.dataset = rdf.dataset()
    }

    const loadFile = fromStream(rdf.dataset(), fromFile(filePath))
      .then(quads => addAll(this.dataset, quads))
    this.sources.push(loadFile)

    return this
  }

  // I would consider renaming if this is targeted at the API re-base
  replaceIRI (oldIRI, newIRI) {
    this.dataset = replaceDatasetIRI(oldIRI, newIRI, this.dataset)
    return this
  }

  static fromFile (filePath, options) {
    const api = new Api(options)

    return api.fromFile(filePath)
  }
}

module.exports = Api
