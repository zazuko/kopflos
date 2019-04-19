const namespace = require('@rdfjs/namespace')

const namespaces = {
  hydra: namespace('http://www.w3.org/ns/hydra/core#'),
  hydraBox: namespace('http://hydra-box.org/schema/'),
  rdf: namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  code: namespace('https://code.described.at/')
}

module.exports = namespaces
