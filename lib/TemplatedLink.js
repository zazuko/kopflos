const ns = require('./namespaces')
const ApiObject = require('./ApiObject')
const IriTemplate = require('./IriTemplate')
const Router = require('express').Router
const SparqlView = require('./SparqlView')

class TemplatedLink extends ApiObject {
  constructor (options) {
    super(options.api, options.iri)

    this.handle = this._handle.bind(this)

    this.router = new Router()

    this.iriTemplate = new IriTemplate(options)
    this.router.use(this.iriTemplate.handle)

    this.api.match(this.iri, ns.hydra.supportedOperation).toArray().map(t => t.object).forEach((operation) => {
      if (this.api.match(operation, ns.rdf.type, ns.hydraView.HydraView).length > 0) {
        const view = new SparqlView({
          api: this.api,
          iri: operation,
          basePath: options.basePath,
          endpointUrl: options.sparqlEndpointUrl,
          debug: options.debug
        })

        this.router.use(view.handle)
      }
    })
  }

  _handle (req, res, next) {
    if (!this.iriTemplate.template.test(req.url)) {
      return next()
    }

    this.router.handle(req, res, next)
  }
}

module.exports = TemplatedLink
