const rdf = require('@rdfjs/data-model')
const ns = require('./namespaces')

// Generates IRIs for new resources based on the given rdf:type and parent.
// An actual implementation could use a SPARQL query to find the next IRI.
// A cluster version could use a in memory key value store + SPARQL init.
async function generateIri (node, resource) {
  const type = node.out(ns.rdf.type)

  if (!type.term) {
    throw new Error(`no unique type found for ${node.value}`)
  }

  if (type.term.equals(ns.schema.Row)) {
    const operatorNumber = node.out(ns.schema.operatorNumber).value

    return node.namedNode(`${resource.value}row/${operatorNumber}`).term
  }

  throw new Error(`unknown type: ${type.value}`)
}

module.exports = generateIri
