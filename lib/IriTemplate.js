const ns = require('./namespaces')
const rdf = require('rdf-ext')
const uriTemplate = require('uri-templates')
const ApiObject = require('./ApiObject')

class IriTemplate extends ApiObject {
  constructor (options) {
    super(options.api, options.iri)

    this.handle = this._handle.bind(this)

    this.iriTemplate = uriTemplate(this.value(ns.hydra.template))
    this.variableRepresentation = this.value(ns.hydra.variableRepresentation)
  }

  _handle (req, res, next) {
    if (!this.iriTemplate.test(req.url)) {
      return next()
    }

    req.graph = rdf.dataset()

    const subject = rdf.blankNode()

    const params = this.iriTemplate.fromUri(req.url)

    Object.keys(params).forEach((name) => {
      const mapping = this.findMapping(name)

      if (!mapping) {
        return
      }

      const property = this.valueTerm(ns.hydra.property, mapping)

      if (!property) {
        return
      }

      const values = this.mapValues(mapping, params[name])

      if (!values) {
        return
      }

      values.forEach((value) => {
        req.graph.add(rdf.quad(
          subject,
          property,
          value
        ))
      })
    })

    next()
  }

  findMapping (name) {
    return this.api.match(this.iri, ns.hydra.mapping).toArray().map(t => t.object).filter((mapping) => {
      return this.api.match(mapping, ns.hydra.variable, rdf.literal(name)).length > 0
    }).shift()
  }

  mapValues (mapping, values) {
    values = Array.isArray(values) ? values : [values]

    return values.map(v => rdf.literal(v))
  }
}

module.exports = IriTemplate
