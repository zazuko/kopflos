const { strictEqual, ok } = require('assert')
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

  describe('rebase', () => {
    it('changes the base of IRIs in dataset', () => {
      // given
      const dataset = rdf.dataset()
        .add(rdf.quad(
          rdf.namedNode('http://example.org/S'),
          rdf.namedNode('http://example.org/P'),
          rdf.namedNode('http://example.org/O'))
        )
      const api = new Api({ dataset })

      // when
      api.rebase('http://example.org/', 'http://example.com/')

      // then
      ok([...api.dataset][0].equals(rdf.quad(
        rdf.namedNode('http://example.com/S'),
        rdf.namedNode('http://example.com/P'),
        rdf.namedNode('http://example.com/O')
      )))
    })
  })
})
