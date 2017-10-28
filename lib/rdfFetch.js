const fetch = require('./fetch')
const rdfFetch = require('rdf-fetch')

module.exports = function (url, options) {
  options = options || {}

  options.fetch = fetch

  return rdfFetch(url, options)
}
