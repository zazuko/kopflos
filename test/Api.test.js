const mock = require('mock-require')
const { toStream } = require('rdf-dataset-ext')
const sinon = require('sinon')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
mock('rdf-utils-fs', {
  fromFile: sinon.stub().callsFake(() => toStream(rdf.dataset()))
})

const rdfUtilsFs = require('rdf-utils-fs')
const { strictEqual, ok } = require('assert')
const { describe, it, afterEach } = require('mocha')
const Api = require('../Api')

describe('Api', () => {
  afterEach(() => {
    rdfUtilsFs.fromFile.resetHistory()
  })

  afterEach(() => {
    mock.stopAll()
  })

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

    it('returns self', async () => {
      // given
      const dataset = rdf.dataset()

      // when
      const api = new Api({ dataset })
      const returned = api.fromFile('foo')
      await api.init()

      // then
      strictEqual(returned, api)
    })
  })

  describe('fromFile', () => {
    it('returns self', async () => {
      // given
      const dataset = rdf.dataset()

      // when
      const api = new Api({ dataset })
      const returned = api.fromFile('foo')
      await api.init()

      // then
      strictEqual(returned, api)
    })

    it('combines loaded datasets', async () => {
      // given
      rdfUtilsFs.fromFile.callsFake((name) => {
        return toStream(rdf.dataset([
          rdf.quad(rdf.blankNode(), rdf.namedNode('file'), rdf.literal(name))
        ]))
      })

      // when
      const api = Api.fromFile('first')
        .fromFile('second')
        .fromFile('third')
      await api.init()

      // then
      strictEqual(api.sources.length, 3)
      strictEqual(api.dataset.size, 4)
    })
  })
})
