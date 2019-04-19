const ns = require('./namespaces')
const rdfFetch = require('rdf-fetch')
const ApiObject = require('./ApiObject')

class SparqlQuery extends ApiObject {
  constructor (options) {
    super(options.api, options.iri)

    this.debug = options.debug

    this.client = options.client
    this.sparqlQuery = options.sparqlQuery

    if (options.authentication) {
      this.headers = {
        authorization: SparqlQuery.basicAuthHeader(options.authentication.user, options.authentication.password)
      }
    }

    this.handle = this._handle.bind(this)
  }

  _handle (req, res, next) {
    const variables = this.buildVariables(req)
    const query = SparqlQuery.evalTemplateString(this.sparqlQuery, variables, { locals: res.locals, env: process.env })

    if (this.debug) {
      console.log('SPARQL query: ' + query)
    }

    const options = {
      headers: Object.assign({}, this.headers, {
        accept: rdfFetch.defaults.formats.parsers.list().filter(mediaType => mediaType !== 'application/json').join(', ')
      })
    }

    return Promise.resolve().then(() => {
      return this.client.constructQuery(query, options)
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

module.exports = SparqlQuery
