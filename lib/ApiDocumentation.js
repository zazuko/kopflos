const rdfBodyParser = require('rdf-body-parser')
const url = require('url')
const ApiObject = require('./ApiObject')

class ApiDocumentation extends ApiObject {
  constructor (options) {
    super(options.api, options.iri)

    this.handle = this._handle.bind(this)

    this.path = url.parse(this.iri).path
  }

  _handle (req, res, next) {
    res.header('Link', '<' + this.iri + '>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"')

    if (url.parse(req.absoluteUrl()).pathname === this.path) {
      rdfBodyParser.attach(req, res).then(() => {
        res.graph(this.api).catch(next)
      })
    } else {
      next()
    }
  }
}

module.exports = ApiDocumentation
