import uriTemplateRoute from 'uri-template-route'
import rdf from '@zazuko/env-node'
import { Router } from 'express'
import log from '../log.js'

const { debug } = log('iriTemplate')

const literalValueRegex = /^"(?<value>.+)"(@|\^\^)?((?<=@)(?<language>.*))?((?<=\^\^)(?<datatype>.*))?$/

/**
 *
 * @param {Clownface} template
 * @param {string} value
 * @returns {NamedNode|Literal|string}
 */
function createTermFromVariable({ template, value }) {
  if (!rdf.ns.hydra.ExplicitRepresentation.equals(template.out(rdf.ns.hydra.variableRepresentation).term)) {
    return value
  }

  const parseValue = value => {
    const matches = value.match(literalValueRegex)
    if (matches) {
      let datatypeOrLanguage = matches.groups.language
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

function middleware({ dataset, term, graph }) {
  const iriTemplateNode = rdf.clownface({ dataset, term, graph })
  const template = iriTemplateNode.out(rdf.ns.hydra.template).value

  if (!template) {
    debug(`ignore ${term.value} because it has no hydra:template property`)

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

      templateParams.addOut(property, createTermFromVariable({ template: iriTemplateNode, value }))
    })

    req.dataset = () => {
      return Promise.resolve(templateParams.dataset)
    }

    req.quadStream = () => {
      return templateParams.dataset.toStream()
    }

    next()
  })
}

export default function factory({ dataset, graph }) {
  const node = rdf.clownface({ dataset, graph })
  const router = new Router()

  node.has(rdf.ns.rdf.type, rdf.ns.hydra.IriTemplate).forEach(iriTemplateNode => {
    debug('Creating route for IriTemplate', iriTemplateNode.term.value)
    router.use(middleware(iriTemplateNode))
  })

  return router
}
