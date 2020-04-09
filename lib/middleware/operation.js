const debug = require('debug')('hydra-box:operation')
const clownface = require('clownface')
const ns = require('../namespaces')

function factory (api) {
  return (req, res, next) => {
    if (!req.hydra.resource) {
      return next()
    }

    const operations = []

    const method = req.method === 'HEAD' ? 'GET' : req.method

    clownface({ ...api, term: [...req.hydra.resource.types] })
      .out(ns.hydra.supportedOperation)
      .has(ns.hydra.method, method).forEach(operation => {
        operations.push(operation)
      })

    clownface({ ...api, term: [...req.hydra.resource.types] })
      .out(ns.hydra.supportedProperty)
      .out(ns.hydra.property)
      .out(ns.hydra.supportedOperation)
      .has(ns.hydra.method, method).forEach(operation => {
        operations.push(operation)
      })

    if (operations.length === 0) {
      debug('no operations found')

      return next()
    }

    const operation = api.loaderRegistry.load(operations[0].out(ns.code.implementedBy), { basePath: api.codePath })

    if (!operation) {
      debug('could not load operation')

      return next()
    }

    operation(req, res, next)
  }
}

module.exports = factory
