const rdf = require('@rdfjs/data-model')
const setGraph = require('./setGraph')

function unsetGraph (dataset) {
  return setGraph(dataset, rdf.defaultGraph())
}

module.exports = unsetGraph
