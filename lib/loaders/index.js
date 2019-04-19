const LoaderRegistry = require('rdf-native-loader')
const {hydraBox} = require('../namespaces')
const SparqlViewLoader = require('./SparqlViewLoader')
const SparqlUpdate = require('../SparqlUpdate')
const SparqlQuery = require('../SparqlQuery')

module.exports = () => {
  const registry = new LoaderRegistry()

  registry.registerNodeLoader(hydraBox.SparqlQuery, SparqlViewLoader(SparqlQuery))
  registry.registerNodeLoader(hydraBox.SparqlUpdate, SparqlViewLoader(SparqlUpdate))

  return registry
}
