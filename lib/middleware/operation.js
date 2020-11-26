const { Router } = require('express')
const { error, warn } = require('../log')('operation')
const createError = require('http-errors')
const clownface = require('clownface')
const ns = require('@tpluscode/rdf-ns-builders')
const { code } = require('../namespaces')

function findClassOperations (types, method) {
  let operations = types.out(ns.hydra.supportedOperation)

  if (method) {
    operations = operations.has(ns.hydra.method, method)
  }

  return operations
}

function findCandidatePropertyOperations ({ types, method, term, resource }) {
  const properties = [...resource.dataset
    .match(resource.term, resource.property, term)]
    .map(({ predicate }) => predicate)

  let operations = types
    .out(ns.hydra.supportedProperty)
    .has(ns.hydra.property, properties)
    .out(ns.hydra.property)
    .out(ns.hydra.supportedOperation)

  if (method) {
    operations = operations.has(ns.hydra.method, method)
  }

  return operations
}

function findPropertyOperations ({ term, resourceCandidates, api, method }) {
  const apiGraph = clownface(api)

  return resourceCandidates
    .reduce((matched, resource) => {
      const types = apiGraph.node([...resource.types])

      const more = findCandidatePropertyOperations({ types, method, term, resource })

      if (!matched) {
        return more
      }

      if (more.terms.length === 0) {
        return matched
      }

      return clownface({
        _context: [...matched._context, more._context]
      })
    }, null)
}

function invokeOperation (api) {
  return async function (req, res, next) {
    if (!req.hydra.operation) {
      warn('no operations found')
      let allowedOperations
      if (req.hydra.resource) {
        const types = clownface({ ...api, term: [...req.hydra.resource.types] })
        allowedOperations = findClassOperations(types)
      } else {
        allowedOperations = findPropertyOperations({ term: req.hydra.term, resourceCandidates: res.locals.hydra.resourceCandidates, api })
      }

      if (allowedOperations.values.length === 0) {
        return next(new createError.NotFound())
      }

      const allowedMethods = new Set(allowedOperations.out(ns.hydra.method).values)
      res.setHeader('Allow', [...allowedMethods])
      return next(new createError.MethodNotAllowed())
    }

    const handler = await api.loaderRegistry.load(req.hydra.operation.out(code.implementedBy), { basePath: api.codePath })

    if (!handler) {
      return next(new Error('Failed to load operation'))
    }

    handler(req, res, next)
  }
}

function findOperation (api) {
  return async function (req, res, next) {
    let operation, rest
    const method = req.method === 'HEAD' ? 'GET' : req.method

    if (res.locals.hydra.resourceCandidates) {
      // try finding the operation by property usage
      [operation, ...rest] = findPropertyOperations({
        term: req.hydra.term,
        resourceCandidates: res.locals.hydra.resourceCandidates,
        api,
        method
      }).toArray()
    }

    if (!operation && !req.hydra.resource) {
      return next()
    }

    if (!operation) {
      // look for direct operation when the root resource is requested
      const types = clownface({ ...api, term: [...req.hydra.resource.types] })

      ;[operation, ...rest] = findClassOperations(types, method).toArray()
    }

    if (rest.length > 0) {
      error('Multiple operations found')
      return next(new Error('Ambiguous operation'))
    }

    req.hydra.operation = operation
    return next()
  }
}

function factory (api, resourceMiddleware) {
  const router = Router()

  router.use(findOperation(api))

  if (resourceMiddleware) {
    router.use(resourceMiddleware)
  }
  router.use(invokeOperation(api))

  return router
}

module.exports = factory
