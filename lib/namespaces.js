const rdf = require('rdf-ext')

const namespaces = {
  hydra: {
    IriTemplate: rdf.namedNode('http://www.w3.org/ns/hydra/core#IriTemplate'),
    mapping: rdf.namedNode('http://www.w3.org/ns/hydra/core#mapping'),
    method: rdf.namedNode('http://www.w3.org/ns/hydra/core#method'),
    property: rdf.namedNode('http://www.w3.org/ns/hydra/core#property'),
    search: rdf.namedNode('http://www.w3.org/ns/hydra/core#search'),
    supportedOperation: rdf.namedNode('http://www.w3.org/ns/hydra/core#supportedOperation'),
    template: rdf.namedNode('http://www.w3.org/ns/hydra/core#template'),
    variable: rdf.namedNode('http://www.w3.org/ns/hydra/core#variable'),
    variableRepresentation: rdf.namedNode('http://www.w3.org/ns/hydra/core#variableRepresentation')
  },
  hydraView: {
    HydraView: rdf.namedNode('http://example.org/hv/HydraView'),
    code: rdf.namedNode('http://example.org/hv/code'),
    returnCsvMetadata: rdf.namedNode('http://example.org/hv/returnCSVMetadata'),
    returnFrame: rdf.namedNode('http://example.org/hv/returnFrame'),
    source: rdf.namedNode('http://example.org/hv/source'),
    variables: rdf.namedNode('http://example.org/hv/variables')
  },
  rdf: {
    type: rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
  }
}

module.exports = namespaces
