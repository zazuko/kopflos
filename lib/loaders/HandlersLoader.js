const cf = require('clownface')
const ns = require('../namespaces')
const parseArguments = require('rdf-native-loader-code/arguments')

module.exports = (term, dataset, { basePath, context, loaderRegistry }) => {
  return parseArguments(cf(dataset).node(term).out(ns.code.arguments), dataset, { basePath, context, loaderRegistry })
}
