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

function findCandidatePropertyOperations ({ types, method, resource }) {
  const properties = [...resource.dataset
    .match(resource.term, resource.property, resource.object)]
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

function findPropertyOperations ({ resource, api, method }) {
  const apiGraph = clownface(api)

  return [resource]
    .reduce((matched, resource) => {
      const types = apiGraph.node([...resource.types])

      const more = findCandidatePropertyOperations({ types, method, resource })

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

function mapOperations ({ api, req, res, method }) {
  return res.locals.hydra.resources.flatMap((resource) => {
    let moreOperations
    if ('property' in resource) {
      moreOperations = findPropertyOperations({
        term: resource.object,
        resource,
        method,
        api
      }).toArray()
    } else {
      const types = clownface({ ...api, term: [...resource.types] })
      moreOperations = findClassOperations(types, method).toArray()
    }

    if (moreOperations.length) {
      return moreOperations.map(operation => ({ resource, operation }))
    }

    return [{ resource, operation: null }]
  })
}

function invokeOperation (api) {
  return async function (req, res, next) {
    if (!req.hydra.operation) {
      const operationMap = mapOperations({ api, req, res })
      const allowedMethods = new Set(operationMap
        .filter(({ operation }) => operation)
        .flatMap(({ operation }) => operation.out(ns.hydra.method).values))

      if (!allowedMethods.size) {
        warn('no operations found')
        if (operationMap.every(({ resource }) => 'property' in resource)) {
          return next(new createError.NotFound())
        }
        return next(new createError.MethodNotAllowed())
      }

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
    const method = req.method === 'HEAD' ? 'GET' : req.method

    const operations = mapOperations({ api, req, res, method }).filter(({ operation }) => operation)

    if (!operations.length) {
      return next()
    }

    if (operations.length > 1) {
      error('Multiple operations found')
      return next(new Error('Ambiguous operation'))
    }

    const [{ resource, operation }] = operations
    req.hydra.resource = resource
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
