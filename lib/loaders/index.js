const LoaderRegistry = require('rdf-native-loader')
const {hydraBox} = require('../namespaces')
const SparqlViewLoader = require('./SparqlViewLoader')

module.exports = () => {
  const registry = new LoaderRegistry()

  registry.registerNodeLoader(hydraBox.SparqlQuery, SparqlViewLoader)

  return registry
}
