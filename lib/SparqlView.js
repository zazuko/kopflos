const clone = require('lodash/clone')
const formats = require('rdf-formats-common')()
const fs = require('fs')
const ns = require('./namespaces')
const path = require('path')
const rdfBodyParser = require('rdf-body-parser')
const rdfFetch = require('rdf-fetch')
const JsonLdSerializer = require('rdf-serializer-jsonld-ext')
const ApiObject = require('./ApiObject')
const SparqlHttp = require('sparql-http-client')

class SparqlView extends ApiObject {
  constructor (options) {
    super(options.api, options.iri)

    options.basePath = options.basePath || '.'

    this.handle = this._handle.bind(this)

    this.debug = options.debug

    const codeIri = this.valueTerm(ns.hydraView.code)
    const sourceIri = this.valueTerm(ns.hydraView.source, codeIri)

    this.sparqlQuery = fs.readFileSync(path.resolve(options.basePath, sourceIri.value.slice(7))).toString()

    this.variablesIri = this.api.match(null, ns.hydra.supportedOperation, this.iri).toArray().map(t => t.subject).shift()

    this.client = new SparqlHttp({endpointUrl: options.endpointUrl, fetch: rdfFetch})

    this.customFormats = {
      serializers: clone(formats.serializers)
    }

    const returnFrameIri = this.valueTerm(ns.hydraView.returnFrame)

    if (returnFrameIri) {
      this.contextHeader = options.contextHeader

      this.returnFrame = JSON.parse(fs.readFileSync(path.resolve(options.basePath, returnFrameIri.value.slice(7))).toString())
      this.returnFrameKey = path.basename(returnFrameIri.value)

      const jsonSerializer = new JsonLdSerializer({
        context: this.returnFrame,
        frame: true,
        outputFormat: 'string',
        skipContext: this.contextHeader,
        skipGraphProperty: true
      })

      this.customFormats.serializers['application/json'] = jsonSerializer
      this.customFormats.serializers['application/ld+json'] = jsonSerializer
    }
  }

  _handle (req, res, next) {
    if (this.contextHeader) {
      res.setJsonLdContext(this.returnFrame, this.returnFrameKey)
    }

    const variables = this.buildVariables(req)
    const query = SparqlView.evalTemplateString(this.sparqlQuery, variables)

    if (this.debug) {
      console.log('SPARQL query: ' + query)
    }

    rdfBodyParser.attach(req, res, {formats: this.customFormats}).then(() => {
      return this.client.constructQuery(query)
    }).then((result) => {
      return result.quadStream()
    }).then((output) => {
      res.graph(output)
    }).catch(next)
  }

  buildVariables (req) {
    return this.api.match(this.variablesIri, ns.hydra.mapping).toArray().map(t => t.object).reduce((locals, mapping) => {
      const name = this.value(ns.hydra.variable, mapping)
      const property = this.valueTerm(ns.hydra.property, mapping)

      locals[name] = undefined

      req.graph.match(null, property).toArray().map(t => t.object).forEach((value) => {
        if (locals[name]) {
          if (!Array.isArray(locals[name])) {
            locals[name] = [locals[name]]
          }

          locals[name].push(value)
        } else {
          locals[name] = value
        }
      })

      return locals
    }, {})
  }

  static evalTemplateString (content, params) {
    const keys = Object.keys(params)
    const values = keys.map(key => params[key])
    const template = Function(keys, 'return `' + content + '`') // eslint-disable-line no-new-func

    return template.apply(null, values)
  }
}

module.exports = SparqlView
