const debug = require('debug')('hydra-box:resource')
const clownface = require('clownface')
const ns = require('../namespaces')
const { fromStream } = require('rdf-dataset-ext')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const TermSet = require('@rdfjs/term-set')

async function loadResource (store, term) {
  const dataset = await fromStream(rdf.dataset(), store.match(null, null, null, term))

  if (dataset.size === 0) {
    return null
  }

  const types = new TermSet(clownface({ dataset, term }).out(ns.rdf.type).terms)

  return {
    term,
    dataset,
    types
  }
}

async function findClassResource (store, term) {
  return loadResource(store, term)
}

async function findPropertyResource (store, propertyTerm) {
  const dataset = await fromStream(rdf.dataset(), store.match(null, null, propertyTerm, null))

  if (dataset.size === 0) {
    return null
  }

  const term = [...dataset][0].subject

  return loadResource(store, term)
}

function factory (store) {
  return async (req, res, next) => {
    req.hydra.resource =
      await findClassResource(store, req.hydra.term) ||
      await findPropertyResource(store, req.hydra.term)

    if (req.hydra.resource) {
      debug(`IRI: ${req.hydra.resource.term.value}`)
      debug(`types: ${[...req.hydra.resource.types].map(term => term.value).join(' ')}`)
    } else {
      debug(`no matching resource found: ${req.hydra.term.value}`)
    }

    next()
  }
}

module.exports = factory
