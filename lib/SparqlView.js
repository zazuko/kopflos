const fs = require('fs')
const fetch = require('nodeify-fetch')
const ns = require('./namespaces')
const path = require('path')
const uriTemplate = require('uri-templates')
const SparqlHttp = require('sparql-http-client')

class SparqlView {
  constructor (options) {
    this.handle = this._handle.bind(this)

    this.api = options.api
    this.iri = options.iri

    const codeIri = this.api.match(this.iri, ns.hydraView.code).toArray().map(t => t.object).shift()
    const sourceIri = this.api.match(codeIri, ns.hydraView.source).toArray().map(t => t.object).shift()

    this.sparqlQuery = fs.readFileSync(path.resolve(sourceIri.value.slice(7))).toString()

    const variablesIri = this.api.match(null, ns.hydra.supportedOperation, this.iri).toArray().map(t => t.subject).shift()
    const templateIri = this.api.match(variablesIri, ns.hydra.template).toArray().map(t => t.object).shift()

    this.iriTemplate = uriTemplate(templateIri.value)

    this.client = new SparqlHttp({endpointUrl: options.endpointUrl, fetch: fetch})
  }

  _handle (req, res, next) {
    if (!this.iriTemplate.test(req.url)) {
      return next()
    }

    const params = this.iriTemplate.fromUri(req.url)
    const query = SparqlView.evalTemplateString(this.sparqlQuery, params)

    console.log(params)
    console.log(query)

    this.client.selectQuery(query).then(result => result.json()).then((result) => {
      const values = ((result.results && result.results.bindings) || []).map((row) => {
        return Object.keys(row).reduce((mappedRow, key) => {
          mappedRow[key] = row[key].value

          return mappedRow
        }, {})
      })

      res.json(values)
    }).catch(next)
  }

  static evalTemplateString (content, params) {
    const keys = Object.keys(params)
    const values = keys.map(key => params[key])
    const template = Function(keys, 'return `' + content + '`') // eslint-disable-line no-new-func

    return template.apply(null, values)
  }
}

module.exports = SparqlView
