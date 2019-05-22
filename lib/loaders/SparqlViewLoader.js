const cf = require('clownface')
const fetch = require('../fetch')
const ns = require('../namespaces')

module.exports = (SparqlView) =>
  async function loader (term, dataset, { context: { options, hydraView, client }, loaderRegistry }) {
    const node = cf(dataset).node(term)
    const source = await fetch(node.out(ns.hydraBox.source).term.value)

    const view = new SparqlView({
      api: dataset,
      iri: hydraView.iri,
      sparqlQuery: await source.text(),
      client,
      authentication: options.authentication,
      debug: options.debug
    })

    if (options.debug) {
      console.log('HydraView route: (' + hydraView.method + ') ' + hydraView.path)
    }

    return view.handle
  }
