const namespace = require('@rdfjs/namespace')

module.exports = {
  dc: namespace('http://purl.org/dc/elements/1.1/'),
  rdf: namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: namespace('http://www.w3.org/2000/01/rdf-schema#'),
  schema: namespace('http://localhost:9000/api/schema/'),
  xsd: namespace('http://www.w3.org/2001/XMLSchema#')
}
