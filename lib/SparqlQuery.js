const SparqlView = require('./SparqlView')

class SparqlQuery extends SparqlView {
  _executeQuery (query, options) {
    return this.client.constructQuery(query, options)
  }
}

module.exports = SparqlQuery
