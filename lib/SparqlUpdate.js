const SparqlView = require('./SparqlView')

class SparqlUpdate extends SparqlView {
  _executeQuery (query, options) {
    this.client.updateQuery(query, options)
  }
}

module.exports = SparqlUpdate
