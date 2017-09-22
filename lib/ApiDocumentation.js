const rdfBodyParser = require('rdf-body-parser')
const setLink = require('./setLink')
const url = require('url')
const ApiObject = require('./ApiObject')

class ApiDocumentation extends ApiObject {
  constructor (options) {
    super(options.api, options.iri)

    this.handle = this._handle.bind(this)

    this.path = url.parse(this.iri).path
  }

  _handle (req, res, next) {
    setLink.attach(res)

    res.setLink(this.documentationLink(req), 'http://www.w3.org/ns/hydra/core#apiDocumentation')

    if (url.parse(req.absoluteUrl()).pathname === this.path) {
      rdfBodyParser.attach(req, res).then(() => {
        res.graph(this.api).catch(next)
      })
    } else {
      next()
    }
  }

  documentationLink (req) {
    const base = url.parse(req.absoluteUrl())
    const iri = url.parse(this.iri)

    return url.format({
      protocol: base.protocol,
      auth: base.auth,
      host: base.host,
      pathname: iri.pathname,
      hash: iri.hash
    })
  }
}

module.exports = ApiDocumentation
