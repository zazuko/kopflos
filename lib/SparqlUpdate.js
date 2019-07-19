const SparqlView = require('./SparqlView')

class SparqlUpdate extends SparqlView {
  async _executeQuery (query, options, req, res) {
    const result = await this.client.updateQuery(query, options)
    if (!result.ok) {
      throw new Error(result.statusText)
    }
  }

  _sendResponse ({ res }) {
    res.status(204)
  }
}

module.exports = SparqlUpdate
