const clownface = require('clownface')
const { fromFile } = require('rdf-utils-fs')
const { addAll, fromStream } = require('rdf-dataset-ext')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const { replaceDatasetIRI } = require('./lib/replaceIRI')
const ns = require('@tpluscode/rdf-ns-builders')
const Api = require('./lib/Api')

class FileApi extends Api {
  constructor ({ term, dataset, graph, path, codePath } = {}) {
    super({ term, dataset, path, codePath })

    this.graph = graph
    this.tasks = []
  }

  async init () {
    if (!this._initialization) {
      this._initialization = this._beginInit()
    }

    return this._initialization
  }

  fromFile (filePath) {
    this.tasks.push(async () => {
      addAll(this.dataset, await fromStream(rdf.dataset(), fromFile(filePath)))
    })

    return this
  }

  rebase (fromBaseIRI, toBaseIRI) {
    this.tasks.push(async () => {
      this.dataset = replaceDatasetIRI(fromBaseIRI, toBaseIRI, this.dataset)
    })

    return this
  }

  static fromFile (filePath, options) {
    const api = new FileApi(options)

    return api.fromFile(filePath)
  }

  async _beginInit () {
    if (!this.dataset) {
      this.dataset = rdf.dataset()
    }

    for (const task of this.tasks) {
      await task()
    }

    const apiDoc = clownface({ dataset: this.dataset, term: this.term, graph: this.graph })

    if (apiDoc.has(ns.rdf.type, ns.hydra.ApiDocumentation).terms.length === 0) {
      apiDoc.addOut(ns.rdf.type, ns.hydra.ApiDocumentation)

      apiDoc.node().has(ns.rdf.type, ns.hydra.Class).forEach(supportedClass => {
        apiDoc.addOut(ns.hydra.supportedClass, supportedClass)
      })
    }
  }
}

module.exports = FileApi
