const { debug, warn } = require('../log')('operation')
const clownface = require('clownface')
const ns = require('@tpluscode/rdf-ns-builders')
const { code } = require('../namespaces')

function factory (api) {
  return (req, res, next) => {
    if (!req.hydra.resource) {
      return next()
    }

    const operations = []

    const method = req.method === 'HEAD' ? 'GET' : req.method
    const types = clownface({ ...api, term: [...req.hydra.resource.types] })

    types
      .out(ns.hydra.supportedOperation)
      .has(ns.hydra.method, method).forEach(operation => {
        operations.push(operation)
      })

    types
      .out(ns.hydra.supportedProperty)
      .out(ns.hydra.property)
      .out(ns.hydra.supportedOperation)
      .has(ns.hydra.method, method).forEach(operation => {
        operations.push(operation)
      })

    if (operations.length === 0) {
      warn('no operations found')

      return next()
    }

    const operation = api.loaderRegistry.load(operations[0].out(code.implementedBy), { basePath: api.codePath })

    if (!operation) {
      warn('could not load operation')

      return next()
    }

    req.hydra.operation = operations[0]
    operation(req, res, next)
  }
}

module.exports = factory
