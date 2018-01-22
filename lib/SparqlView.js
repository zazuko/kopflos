const fetch = require('./fetch')
const ns = require('./namespaces')
const rdfFetch = require('rdf-fetch')
const ApiObject = require('./ApiObject')
const SparqlHttp = require('sparql-http-client')

class SparqlView extends ApiObject {
  constructor (options) {
    super(options.api, options.iri)

    this.debug = options.debug

    this.endpointUrl = options.endpointUrl
    this.code = this.valueTerm(ns.hydraBox.code)
    this.source = this.valueTerm(ns.hydraBox.source, this.code)
    this.variables = this.valueTerm(ns.hydraBox.variables)

    this.handle = this._handle.bind(this)
  }

  init () {
    return fetch(this.source.value).then(res => res.text()).then((sparqlQuery) => {
      this.sparqlQuery = sparqlQuery

      this.client = new SparqlHttp({
        endpointUrl: this.endpointUrl,
        fetch: rdfFetch
      })
    })
  }

  _handle (req, res, next) {
    const variables = this.buildVariables(req)
    const query = SparqlView.evalTemplateString(this.sparqlQuery, variables, res.locals)

    if (this.debug) {
      console.log('SPARQL query: ' + query)
    }

    const options = {
      headers: {
        accept: rdfFetch.defaults.formats.parsers.list().filter(mediaType => mediaType !== 'application/json').join(', ')
      }
    }

    return this.client.constructQuery(query, options).then((result) => {
      return result.quadStream()
    }).then((output) => {
      res.graph(output)
    }).catch(next)
  }

  buildVariables (req) {
    return this.api.match(this.variables, ns.hydra.mapping).toArray().map(t => t.object).reduce((locals, mapping) => {
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

  static evalTemplateString (content, params, context) {
    const keys = Object.keys(params)
    const values = keys.map(key => params[key])
    const template = Function(keys, 'return `' + content + '`') // eslint-disable-line no-new-func

    return template.apply(context, values)
  }
}

module.exports = SparqlView
