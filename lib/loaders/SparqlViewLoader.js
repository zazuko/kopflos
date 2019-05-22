const cf = require('clownface')
const fetch = require('../fetch')
const ns = require('../namespaces')

module.exports = (SparqlView) =>
  async function loader (term, dataset, { context: { options, hydraView, client }, loaderRegistry }) {
    const node = cf(dataset).node(term)
    const sourceNodes = node.out(ns.hydraBox.source)

    const sparqlQueries = sourceNodes.values
      ? await Promise.all(sourceNodes.values.map(async (value) => (await fetch(value)).text()))
      : [ await fetch(sourceNodes.term.value) ]

    const view = new SparqlView({
      api: dataset,
      iri: hydraView.iri,
      sparqlQueries,
      client,
      authentication: options.authentication,
      debug: options.debug
    })

    if (options.debug) {
      console.log('HydraView route: (' + hydraView.method + ') ' + hydraView.path)
    }

    return view.handle
  }
