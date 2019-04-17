const fetch = require('./fetch')
const ns = require('./namespaces')
const rdfFetch = require('rdf-fetch')
const ApiObject = require('./ApiObject')
const SparqlHttp = require('sparql-http-client')

class SparqlView extends ApiObject {
  constructor (options) {
    super(options.api, options.iri)

    this.debug = options.debug

    this.queryUrl = options.queryUrl
    this.updateUrl = options.updateUrl

    if (options.authentication) {
      this.headers = {
        authorization: SparqlView.basicAuthHeader(options.authentication.user, options.authentication.password)
      }
    }

    this.code = this.valueTerm(ns.hydraBox.code)
    this.source = this.valueTerm(ns.hydraBox.source, this.code)
    this.variables = this.valueTerm(ns.hydraBox.variables)

    this.handle = this._handle.bind(this)
  }

  init () {
    return fetch(this.source.value).then(res => res.text()).then((sparqlQuery) => {
      this.sparqlQuery = sparqlQuery

      this.client = new SparqlHttp({
        endpointUrl: this.queryUrl,
        updateUrl: this.updateUrl,
        fetch: rdfFetch
      })
    })
  }

  _handle (req, res, next) {
    const variables = this.buildVariables(req)
    const query = SparqlView.evalTemplateString(this.sparqlQuery, variables, { locals: res.locals, env: process.env })

    if (this.debug) {
      console.log('SPARQL query: ' + query)
    }

    const options = {
      headers: Object.assign({}, this.headers, {
        accept: rdfFetch.defaults.formats.parsers.list().filter(mediaType => mediaType !== 'application/json').join(', ')
      })
    }

    return Promise.resolve().then(() => {
      // TODO: very ugly hack. maybe we can define different rdf types for update and query SPARQL code
      if (query.includes('INSERT {')) {
        return this.client.updateQuery(query, options)
      } else {
        return this.client.constructQuery(query, options)
      }
    }).then((result) => {
      if (!result.ok) {
        return Promise.reject(new Error(result.statusText))
      }

      return result.quadStream()
    }).then((output) => {
      if (output) {
        res.graph(output)
      } else {
        res.status(204).end()
      }
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

  static basicAuthHeader (user, password) {
    return 'Basic ' + Buffer.from(user + ':' + password).toString('base64')
  }
}

module.exports = SparqlView
