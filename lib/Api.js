const LoaderRegistry = require('rdf-loaders-registry')
const EcmaScriptLoader = require('rdf-loader-code/ecmaScript')
const EcmaScriptLiteralLoader = require('rdf-loader-code/ecmaScriptLiteral')

class Api {
  constructor ({ term, dataset, path, codePath } = {}) {
    this.term = term
    this.dataset = dataset
    this.path = path
    this.codePath = codePath
    this.initialized = false

    this.loaderRegistry = new LoaderRegistry()

    EcmaScriptLoader.register(this.loaderRegistry)
    EcmaScriptLiteralLoader.register(this.loaderRegistry)
  }
}

module.exports = Api
