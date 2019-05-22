const MultiStream = require('multistream')
const {isReadable} = require('isstream')
const SparqlView = require('./SparqlView')

class SparqlQuery extends SparqlView {
  async _executeQuery (query, options) {
    const result = await this.client.constructQuery(query, options)
    if (!result.ok) {
      throw new Error(result.statusText)
    }

    return result.quadStream()
  }

  _sendResponse ({ queryResults, res }) {
    const streams = queryResults.filter(isReadable)
    if (streams.length > 0) {
      return res.graph(MultiStream.obj(streams))
    }
  }
}

module.exports = SparqlQuery
