const { error, warn } = require('../log')('operation')
const clownface = require('clownface')
const ns = require('@tpluscode/rdf-ns-builders')
const { code } = require('../namespaces')

function findClassOperations (types, method) {
  return types
    .out(ns.hydra.supportedOperation)
    .has(ns.hydra.method, method)
    .toArray()
}

function findPropertyOperations (types, method, term, resource) {
  const properties = [...resource.dataset
    .match(resource.term, null, term)]
    .map(({ predicate }) => predicate)

  return types
    .out(ns.hydra.supportedProperty)
    .has(ns.hydra.property, properties)
    .out(ns.hydra.property)
    .out(ns.hydra.supportedOperation)
    .has(ns.hydra.method, method)
    .toArray()
}

function factory (api) {
  return (req, res, next) => {
    if (!req.hydra.resource) {
      return next()
    }

    const method = req.method === 'HEAD' ? 'GET' : req.method
    const types = clownface({ ...api, term: [...req.hydra.resource.types] })

    let operations = []
    if (req.hydra.term.equals(req.hydra.resource.term)) {
      // only look for direct operation when the root resource is requested
      operations = findClassOperations(types, method)
    }
    if (operations.length === 0) {
      // otherwise try finding the operation by property usage
      operations = findPropertyOperations(types, method, req.hydra.term, req.hydra.resource)
    }

    const [operation, ...rest] = operations

    if (!operation) {
      warn('no operations found')

      return next()
    }

    if (rest.length > 0) {
      error('Multiple operations found')
      return next(new Error('Ambiguous operation'))
    }

    const handler = api.loaderRegistry.load(operation.out(code.implementedBy), { basePath: api.codePath })

    if (!handler) {
      return next(new Error('Failed to load operation'))
    }

    req.hydra.operation = operation
    handler(req, res, next)
  }
}

module.exports = factory
