const rdf = require('@rdfjs/data-model')
const ns = require('./namespaces')

// Generates IRIs for new resources based on the given rdf:type and parent.
// An actual implementation could use a SPARQL query to find the next IRI.
// A cluster version could use a in memory key value store + SPARQL init.
async function generateIri (type, parent) {
  if (type.equals(ns.schema.Post)) {
    const id = Math.floor(Math.random() * 100000)

    return rdf.namedNode(`${parent.value}post/${id}`)
  }

  throw new Error(`unknown type: ${type.value}`)
}

module.exports = generateIri
