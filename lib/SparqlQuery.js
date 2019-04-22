const SparqlView = require('./SparqlView')

class SparqlQuery extends SparqlView {
  async _executeQuery (query, options, req, res) {
    const result = await this.client.constructQuery(query, options)
    if (!result.ok) {
      throw new Error(result.statusText)
    }

    res.graph(await result.quadStream())
  }
}

module.exports = SparqlQuery
