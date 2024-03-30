import rdf from '@zazuko/env-node'

function iriTemplateMappingBuilder({
  dataset = rdf.dataset(),
  term = rdf.blankNode(),
  graph = rdf.defaultGraph(),
  template,
  variables,
  explicitRepresentation,
} = {}) {
  dataset.add(rdf.quad(term, rdf.ns.rdf.type, rdf.ns.hydra.IriTemplate, graph))

  if (template) {
    dataset.add(rdf.quad(term, rdf.ns.hydra.template, rdf.literal(template), graph))
  }

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const mapping = rdf.blankNode()

      dataset.add(rdf.quad(term, rdf.ns.hydra.mapping, mapping, graph))
      dataset.add(rdf.quad(mapping, rdf.ns.hydra.variable, rdf.literal(key), graph))
      dataset.add(rdf.quad(mapping, rdf.ns.hydra.property, rdf.namedNode(value), graph))
    })
  }

  if (explicitRepresentation) {
    dataset.add(rdf.quad(term, rdf.ns.hydra.variableRepresentation, rdf.ns.hydra.ExplicitRepresentation))
  }

  return {
    dataset,
    graph,
    env: rdf,
  }
}

export default iriTemplateMappingBuilder
