const ns = require('@tpluscode/rdf-ns-builders')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }

function iriTemplateMappingBuilder ({
  dataset = rdf.dataset(),
  term = rdf.blankNode(),
  graph = rdf.defaultGraph(),
  template,
  variables
} = {}) {
  dataset.add(rdf.quad(term, ns.rdf.type, ns.hydra.IriTemplate, graph))

  if (template) {
    dataset.add(rdf.quad(term, ns.hydra.template, rdf.literal(template), graph))
  }

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const mapping = rdf.blankNode()

      dataset.add(rdf.quad(term, ns.hydra.mapping, mapping, graph))
      dataset.add(rdf.quad(mapping, ns.hydra.variable, rdf.literal(key), graph))
      dataset.add(rdf.quad(mapping, ns.hydra.property, rdf.namedNode(value), graph))
    })
  }

  return {
    dataset,
    graph
  }
}

module.exports = iriTemplateMappingBuilder
