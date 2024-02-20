/* eslint-disable @typescript-eslint/no-explicit-any */
import rdf from '@zazuko/env-node'
import { RequestHandler, Router, Response } from 'express'
import type { GraphPointer, MultiPointer } from 'clownface'
import createError from 'http-errors'
import { isGraphPointer } from 'is-graph-pointer'
import type { NamedNode } from '@rdfjs/types'
import type { Dataset } from '@zazuko/env/lib/Dataset.js'
import { code } from '../namespaces.js'
import log from '../log.js'
import { HydraBoxMiddleware } from '../../middleware.js'
import Api from '../../Api.js'
import { PotentialOperation, PropertyResource, Resource } from '../../index.js'

interface OperationLocals {
  hydra: {
    resources: (Resource | PropertyResource)[]
  }
}

type OperationRequestHandler = RequestHandler<any, any, any, any, OperationLocals>

const { error, warn, debug } = log('operation')

function findClassOperations(types: MultiPointer, method?: string) {
  let operations = types.out(rdf.ns.hydra.supportedOperation)

  if (method) {
    operations = operations.has(rdf.ns.hydra.method, method)
  }

  return operations
}

interface FindPropertyOperations {
  resource: PropertyResource
  api: Api
  method?: string
}

function findPropertyOperations({ resource, api, method }: FindPropertyOperations) {
  const apiGraph = rdf.clownface(api)
  const types = apiGraph.node([...resource.types])

  const properties = [...resource.prefetchDataset
    .match(resource.term, resource.property, resource.object)]
    .map(({ predicate }) => predicate)

  let operations = types
    .out(rdf.ns.hydra.supportedProperty)
    .has(rdf.ns.hydra.property, properties)
    .out(rdf.ns.hydra.property)
    .out(rdf.ns.hydra.supportedOperation)

  if (method) {
    operations = operations.has(rdf.ns.hydra.method, method)
  }

  return operations
}

interface MapOperations {
  api: Api
  res: Response<unknown, OperationLocals>
  method?: string
}

type MapEntry = {
  resource: Resource
  operation: GraphPointer | null
}

function mapOperations({ api, res, method }: MapOperations) {
  return res.locals.hydra.resources.flatMap((resource): MapEntry[] => {
    let moreOperations
    if ('property' in resource) {
      moreOperations = findPropertyOperations({ resource, method, api }).toArray()
    } else {
      const types = rdf.clownface({ ...api, term: [...resource.types] })
      moreOperations = findClassOperations(types, method).toArray()
    }

    if (moreOperations.length) {
      return moreOperations.map(operation => ({ resource, operation }))
    }

    return [{ resource, operation: null }]
  })
}

const findOperations: OperationRequestHandler = (req, res, next) => {
  const method = req.method === 'HEAD' ? 'GET' : req.method

  req.hydra.operations = mapOperations({ api: req.hydra.api, res, method })
    .filter((entry): entry is PotentialOperation => !!entry.operation)

  return next()
}

const prepareOperation: RequestHandler = function (req, res, next) {
  if (!req.hydra.operations.length) {
    return next()
  }

  if (req.hydra.operations.length > 1) {
    error('Multiple operations found')
    return next(new Error('Ambiguous operation'))
  }

  const [{ resource, operation }] = req.hydra.operations

  req.hydra.resource = {
    ...resource,
    async clownface(): Promise<GraphPointer<NamedNode, Dataset>> {
      return rdf.clownface({
        term: this.term,
        dataset: await this.dataset(),
      })
    },
  }
  req.hydra.operation = operation
  return next()
}

const invokeOperation: OperationRequestHandler = async (req, res, next) => {
  const { api } = req.hydra

  if (!req.hydra.operation) {
    const operationMap = mapOperations({ api, res })
    const allowedMethods = new Set(operationMap
      .filter((entry): entry is PotentialOperation => !!entry.operation)
      .flatMap(({ operation }) => operation.out(rdf.ns.hydra.method).values))

    if (!allowedMethods.size) {
      warn('no operations found')
      if (operationMap.every(({ resource }) => 'property' in resource)) {
        return next()
      }
      return next(new createError.MethodNotAllowed())
    }

    res.setHeader('Allow', [...allowedMethods])
    return next(new createError.MethodNotAllowed())
  }

  debug(`IRI: ${req.hydra.resource.term.value}`)
  debug(`types: ${[...req.hydra.resource.types].map(term => term.value).join(' ')}`)

  const implementation = req.hydra.operation.out(code.implementedBy)
  let handler: RequestHandler | undefined
  if (isGraphPointer(implementation)) {
    handler = await api.loaderRegistry.load<RequestHandler>(implementation, { basePath: api.codePath })
  }

  if (!handler) {
    return next(new Error('Failed to load operation'))
  }

  handler(req, res, next)
}

export default function factory(middleware: HydraBoxMiddleware = {}) {
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
