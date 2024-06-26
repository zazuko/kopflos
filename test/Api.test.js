import { resolve } from 'node:path'
import { ok, strictEqual } from 'node:assert'
import rdf from '@zazuko/env-node'
import Api from '../Api.js'

const factory = rdf
const __dirname = new URL('.', import.meta.url).pathname

describe('Api', () => {
  it('should be a constructor', () => {
    strictEqual(typeof Api, 'function')
  })

  it('should assign the given dataset', () => {
    const dataset = rdf.dataset()
    const api = new Api({ dataset, factory })

    strictEqual(api.dataset, dataset)
  })

  it('should assign the given graph', () => {
    const graph = rdf.namedNode('http://example.org/graph')
    const api = new Api({ graph, factory })

    strictEqual(api.graph, graph)
  })

  it('should assign the given path', () => {
    const path = '/api'
    const api = new Api({ path, factory })

    strictEqual(api.path, path)
  })

  describe('fromFile', () => {
    it('should be a method', () => {
      const api = new Api({ factory })

      strictEqual(typeof api.fromFile, 'function')
    })

    it('should return the Api instance', () => {
      const api = new Api({ factory })

      const result = api.fromFile('test')

      strictEqual(result, api)
    })

    it('should create a task', () => {
      const api = new Api({ factory })

      api.fromFile('test')

      strictEqual(api.tasks.length, 1)
    })

    it('static call should be chainable', () => {
      const api = Api.fromFile('foo', { factory }).fromFile('bar')

      strictEqual(api.tasks.length, 2)
    })

    it('should load the API from the given file when init is called', async () => {
      const api = new Api({ factory })

      api.fromFile(resolve(__dirname, 'support/api.ttl'))
      await api.init()

      strictEqual(api.dataset.size >= 8, true)
    })
  })

  describe('init', () => {
    it('should be a method', () => {
      const api = new Api({ factory })

      strictEqual(typeof api.init, 'function')
    })

    it('should be async', () => {
      const api = new Api({ dataset: rdf.dataset(), factory })

      const result = api.init()

      strictEqual(typeof result.then, 'function')
      strictEqual(typeof result.catch, 'function')
    })

    it('should create a hydra:ApiDocumentation triple', async () => {
      const term = rdf.namedNode('http://example.org/api')
      const api = new Api({ dataset: rdf.dataset(), term, factory })

      await api.init()

      const apiDoc = rdf.clownface({ dataset: api.dataset, term: api.term, graph: api.graph })
      const subject = apiDoc.has(rdf.ns.rdf.type, rdf.ns.hydra.ApiDocumentation).term

      strictEqual(term.equals(subject), true)
    })
  })

  describe('rebase', () => {
    it('should be a method', () => {
      const api = new Api({ factory })

      strictEqual(typeof api.rebase, 'function')
    })

    it('should return the Api instance', () => {
      const api = new Api({ factory })

      const result = api.rebase()

      strictEqual(result, api)
    })

    it('should change the base of IRIs in the dataset when init is called', async () => {
      // given
      const dataset = rdf.dataset()
        .add(rdf.quad(
          rdf.namedNode('http://example.org/S'),
          rdf.namedNode('http://example.org/P'),
          rdf.namedNode('http://example.org/O')),
        )
      const api = new Api({ dataset, factory })

      // when
      api.rebase('http://example.org/', 'http://example.com/')
      await api.init()

      // then
      ok([...api.dataset][0].equals(rdf.quad(
        rdf.namedNode('http://example.com/S'),
        rdf.namedNode('http://example.com/P'),
        rdf.namedNode('http://example.com/O'),
      )))
    })
  })
})
