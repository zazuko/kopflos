const { Router } = require('express')
const { error, warn, debug } = require('../log')('operation')
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

function findPropertyOperations ({ resource, api, method }) {
  const apiGraph = clownface(api)
  const types = apiGraph.node([...resource.types])

  const properties = [...resource.prefetchDataset
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

function mapOperations ({ api, res, method }) {
  return res.locals.hydra.resources.flatMap((resource) => {
    let moreOperations
    if ('property' in resource) {
      moreOperations = findPropertyOperations({ resource, method, api }).toArray()
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

function findOperations (req, res, next) {
  const method = req.method === 'HEAD' ? 'GET' : req.method

  req.hydra.operations = mapOperations({ api: req.hydra.api, res, method })
    .filter(({ operation }) => operation)

  return next()
}

function prepareOperation (req, res, next) {
  if (!req.hydra.operations.length) {
    return next()
  }

  if (req.hydra.operations.length > 1) {
    error('Multiple operations found')
    return next(new Error('Ambiguous operation'))
  }

  const [{ resource, operation }] = req.hydra.operations
  resource.clownface = async function () {
    return clownface({
      term: this.term,
      dataset: await this.dataset()
    })
  }

  req.hydra.resource = resource
  req.hydra.operation = operation
  return next()
}

async function invokeOperation (req, res, next) {
  const { api } = req.hydra

  if (!req.hydra.operation) {
    const operationMap = mapOperations({ api, res })
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

  debug(`IRI: ${req.hydra.resource.term.value}`)
  debug(`types: ${[...req.hydra.resource.types].map(term => term.value).join(' ')}`)

  const handler = await api.loaderRegistry.load(req.hydra.operation.out(code.implementedBy), { basePath: api.codePath })

  if (!handler) {
    return next(new Error('Failed to load operation'))
  }

  handler(req, res, next)
}

function factory (middleware = {}) {
  const router = Router()

  router.use(findOperations)

  if (middleware.operations) {
    router.use(middleware.operations)
  }

  router.use(prepareOperation)

  if (middleware.resource) {
    router.use(middleware.resource)
  }
  router.use(invokeOperation)

  return router
}

module.exports = factory
