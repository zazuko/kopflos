const debug = require('debug')('hydra-box:iriTemplate')
const clownface = require('clownface')
const { Router } = require('express')
const ns = require('@tpluscode/rdf-ns-builders')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const TermMap = require('@rdfjs/term-map')
const { toStream } = require('rdf-dataset-ext')
const uriTemplateRoute = require('uri-template-route')
const uriTemplate = require('uri-templates')

function prepareMap ({ dataset, term, graph }) {
  const iriTemplateNode = clownface({ dataset, term, graph })
  const template = iriTemplateNode.out(ns.hydra.template).value

  if (!template) {
    debug(`ignore ${term.value} because it has no hydra:template property`)

    return null
  }

  const map = new Map()

  iriTemplateNode.out(ns.hydra.mapping).forEach(mapping => {
    const variable = mapping.out(ns.hydra.variable).value
    const property = mapping.out(ns.hydra.property).term

    map.set(variable, property)
  })

  return { template, map }
}

function attachDataset ({ req, map }) {
  // do nothing if the request has a body
  if (req.get('content-type')) {
    return
  }

  const subject = rdf.blankNode()
  const dataset = rdf.dataset()

  Object.entries(req.params).forEach(([key, value]) => {
    const property = map.get(key)

    if (!property) {
      return
    }

    dataset.add(rdf.quad(subject, property, rdf.literal(value)))
  })

  if (dataset.size === 0) {
    return
  }

  req.dataset = () => {
    return Promise.resolve(dataset)
  }

  req.quadStream = () => {
    return toStream(dataset)
  }
}

function absoluteMiddleware ({ dataset, term, graph }) {
  const { template, map } = prepareMap({ dataset, term, graph })

  if (!template) {
    debug(`ignore ${term.value} because it has no hydra:template property`)

    return
  }

  if (!template.startsWith('/')) {
    debug(`ignore ${term.value} because it is a relative template`)

    return
  }

  return uriTemplateRoute(template, (req, res, next) => {
    attachDataset({ req, map })

    next()
  })
}

function absolute ({ dataset, graph }) {
  const node = clownface({ dataset, graph })
  const router = new Router()

  node.has(ns.rdf.type, ns.hydra.IriTemplate).forEach(iriTemplateNode => {
    const middleware = absoluteMiddleware(iriTemplateNode)

    if (middleware) {
      router.use(middleware)
    }
  })

  return router
}

function relativeMiddleware ({ dataset, term, graph }) {
  const { template: templateString, map } = prepareMap({ dataset, term, graph })

  if (!templateString) {
    debug(`ignore ${term.value} because it has no hydra:template property`)

    return
  }

  if (templateString.startsWith('/')) {
    debug(`ignore ${term.value} because it is an absolute template`)

    return
  }

  const template = uriTemplate(templateString)

  return (req, res, next) => {
    const search = `?${req.url.split('?')[1] || ''}`

    if (!search) {
      return next()
    }

    if (!template.test(search)) {
      return next()
    }

    req.params = template.fromUri(search)

    attachDataset({ req, map })

    next()
  }
}

function relative ({ dataset, graph }) {
  const node = clownface({ dataset, graph })
  const middlewares = new TermMap()

  node.has(ns.rdf.type, ns.hydra.IriTemplate).forEach(iriTemplateNode => {
    iriTemplateNode.in(ns.hydra.search).forEach(classNode => {
      const middleware = relativeMiddleware(iriTemplateNode)

      if (middleware) {
        middlewares.set(classNode.term, middleware)
      }
    })
  })

  return (req, res, next) => {
    const filtered = [...req.hydra.resource.types].map(type => middlewares.get(type)).filter(Boolean)

    if (filtered.length === 0) {
      return next()
    }

    if (filtered.length > 1) {
      return next(new Error(`no unique IRI Template found for: <${req.hydra.term.value}>`))
    }

    filtered[0](req, res, next)
  }
}

module.exports = {
  absolute,
  relative
}
