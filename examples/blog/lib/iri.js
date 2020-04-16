const { resolve: resolvePath } = require('path')
const { URL } = require('url')

function isRelative (iri) {
  return !iri.match(new RegExp('^[a-z]+:'))
}

function resolve (baseIRI, relative) {
  const url = new URL(baseIRI)

  url.pathname = resolvePath(url.pathname, relative)

  return url.toString()
}

module.exports = {
  isRelative,
  resolve
}
