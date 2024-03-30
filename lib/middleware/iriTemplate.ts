import uriTemplateRoute from 'uri-template-route'
import { RequestHandler, Router } from 'express'
import type { GraphPointer } from 'clownface'
import type { NamedNode } from '@rdfjs/types'
import toStream from 'rdf-dataset-ext/toStream.js'
import log from '../log.js'
import { Api } from '../../Api.js'
import Factory from '../factory.js'

const { debug } = log('iriTemplate')

const literalValueRegex = /^"(?<value>.+)"(@|\^\^)?((?<=@)(?<language>.*))?((?<=\^\^)(?<datatype>.*))?$/

function createTermFromVariable({ template, value, rdf }: { template: GraphPointer; value: string; rdf: Factory }) {
  if (!rdf.ns.hydra.ExplicitRepresentation.equals(template.out(rdf.ns.hydra.variableRepresentation).term)) {
    return value
  }

  const parseValue = (value: string) => {
    const matches = value.match(literalValueRegex)
    if (matches?.groups) {
      let datatypeOrLanguage: string | NamedNode = matches.groups.language
      if (matches.groups.datatype) {
        datatypeOrLanguage = rdf.namedNode(matches.groups.datatype)
      }

      return rdf.literal(matches.groups.value, datatypeOrLanguage)
    }

    return rdf.namedNode(value)
  }

  const values = Array.isArray(value) ? value : [value]
  return values.map(parseValue)
}

function middleware(pointer: GraphPointer, rdf: Factory): RequestHandler {
  const iriTemplateNode = rdf.clownface(pointer)
  const template = iriTemplateNode.out(rdf.ns.hydra.template).value

  if (!template) {
    debug(`ignore ${pointer.term.value} because it has no hydra:template property`)

    return (req, res, next) => next
  }

  const variablePropertyMap = new Map()

  iriTemplateNode.out(rdf.ns.hydra.mapping).forEach(mapping => {
    const variable = mapping.out(rdf.ns.hydra.variable).value
    const property = mapping.out(rdf.ns.hydra.property).term

    variablePropertyMap.set(variable, property)
  })

  return uriTemplateRoute(template, (req, res, next) => {
    // do nothing if the request has a body
    if (req.get('content-type')) {
      return next()
    }

    const templateParams = rdf.clownface({ dataset: rdf.dataset() }).blankNode()

    Object.entries(req.params).forEach(([key, value]) => {
      const property = variablePropertyMap.get(key)

      if (!property) {
        return
      }

      templateParams.addOut(property, createTermFromVariable({ template: iriTemplateNode, value, rdf }))
    })

    req.dataset = () => {
      return Promise.resolve(templateParams.dataset)
    }

    req.quadStream = () => {
      return toStream(templateParams.dataset)
    }

    next()
  })
}

export default function factory({ dataset, graph, env: rdf }: Pick<Api, 'dataset' | 'graph' | 'env'>) {
  const node = rdf.clownface({ dataset, graph })
  const router = Router()

  node.has(rdf.ns.rdf.type, rdf.ns.hydra.IriTemplate).forEach(iriTemplateNode => {
    debug('Creating route for IriTemplate', iriTemplateNode.term.value)
    router.use(middleware(iriTemplateNode, rdf))
  })

  return router
}
