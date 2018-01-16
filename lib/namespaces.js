const rdf = require('rdf-ext')

const namespaces = {
  hydra: {
    IriTemplate: rdf.namedNode('http://www.w3.org/ns/hydra/core#IriTemplate'),
    mapping: rdf.namedNode('http://www.w3.org/ns/hydra/core#mapping'),
    method: rdf.namedNode('http://www.w3.org/ns/hydra/core#method'),
    property: rdf.namedNode('http://www.w3.org/ns/hydra/core#property'),
    search: rdf.namedNode('http://www.w3.org/ns/hydra/core#search'),
    supportedClass: rdf.namedNode('http://www.w3.org/ns/hydra/core#supportedClass'),
    supportedOperation: rdf.namedNode('http://www.w3.org/ns/hydra/core#supportedOperation'),
    supportedProperty: rdf.namedNode('http://www.w3.org/ns/hydra/core#supportedProperty'),
    template: rdf.namedNode('http://www.w3.org/ns/hydra/core#template'),
    variable: rdf.namedNode('http://www.w3.org/ns/hydra/core#variable'),
    variableRepresentation: rdf.namedNode('http://www.w3.org/ns/hydra/core#variableRepresentation')
  },
  hydraBox: {
    View: rdf.namedNode('http://hydra-box.org/schema/View'),
    code: rdf.namedNode('http://hydra-box.org/schema/code'),
    returnCsvMetadata: rdf.namedNode('http://hydra-box.org/schema/returnCSVMetadata'),
    returnFrame: rdf.namedNode('http://hydra-box.org/schema/returnFrame'),
    source: rdf.namedNode('http://hydra-box.org/schema/source'),
    variables: rdf.namedNode('http://hydra-box.org/schema/variables')
  },
  rdf: {
    type: rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
  }
}

module.exports = namespaces
