const debug = require('debug')('hydra-box:iriTemplate')
const clownface = require('clownface')
const { Router } = require('express')
const ns = require('@tpluscode/rdf-ns-builders')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const { toStream } = require('rdf-dataset-ext')
const uriTemplateRoute = require('uri-template-route')

function middleware ({ dataset, term, graph }) {
  const iriTemplateNode = clownface({ dataset, term, graph })
  const template = iriTemplateNode.out(ns.hydra.template).value

  if (!template) {
    debug(`ignore ${term.value} because it has no hydra:template property`)

    return (req, res, next) => next
  }

  const variablePropertyMap = new Map()

  iriTemplateNode.out(ns.hydra.mapping).forEach(mapping => {
    const variable = mapping.out(ns.hydra.variable).value
    const property = mapping.out(ns.hydra.property).term

    variablePropertyMap.set(variable, property)
  })

  return uriTemplateRoute(template, (req, res, next) => {
    // do nothing if the request has a body
    if (req.get('content-type')) {
      return next()
    }

    const subject = rdf.blankNode()
    const dataset = rdf.dataset()

    Object.entries(req.params).forEach(([key, value]) => {
      const property = variablePropertyMap.get(key)

      if (!property) {
        return
      }

      dataset.add(rdf.quad(subject, property, rdf.literal(value)))
    })

    req.dataset = () => {
      return Promise.resolve(dataset)
    }

    req.quadStream = () => {
      return toStream(dataset)
    }

    next()
  })
}

function factory ({ dataset, graph }) {
  const node = clownface({ dataset, graph })
  const router = new Router()

  node.has(ns.rdf.type, ns.hydra.IriTemplate).forEach(iriTemplateNode => {
    debug('Creating route for IriTemplate', iriTemplateNode.term.value)
    router.use(middleware(iriTemplateNode))
  })

  return router
}

module.exports = factory
