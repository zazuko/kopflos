const { strictEqual } = require('assert')
const { describe, it } = require('mocha')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const Api = require('../Api')

describe('Api', () => {
  it('should be a constructor', () => {
    strictEqual(typeof Api, 'function')
  })

  it('should assign the given dataset', () => {
    const dataset = rdf.dataset()
    const api = new Api({ dataset })

    strictEqual(api.dataset, dataset)
  })

  it('should assign the given graph', () => {
    const graph = rdf.namedNode('http://example.org/graph')
    const api = new Api({ graph })

    strictEqual(api.graph, graph)
  })

  it('should assign the given path', () => {
    const path = '/api'
    const api = new Api({ path })

    strictEqual(api.path, path)
  })
})
