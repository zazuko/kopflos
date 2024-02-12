import { strictEqual } from 'node:assert'
import { resolve } from 'node:path'
import rdf from '@zazuko/env-node'
import FlatMultiFileStore from 'rdf-store-fs/FlatMultiFileStore.js'
import StoreResourceLoader from '../StoreResourceLoader.js'

const __dirname = new URL('.', import.meta.url).pathname

describe('StoreResourceLoader', () => {
  it('should be a constructor', () => {
    strictEqual(typeof StoreResourceLoader, 'function')
  })

  it('should assign the given store', () => {
    const store = {}
    const loader = new StoreResourceLoader({ store })

    strictEqual(loader.store, store)
  })

  describe('.load', () => {
    it('should be a method', () => {
      const loader = new StoreResourceLoader({ store: {} })

      strictEqual(typeof loader.load, 'function')
    })

    it('should load term, dataset and types from the given named graph', async () => {
      const term = rdf.namedNode('http://example.org/')
      const store = new FlatMultiFileStore({
        baseIRI: 'http://example.org/',
        path: resolve(__dirname, 'support/store'),
      })
      const loader = new StoreResourceLoader({ store })

      const resource = await loader.load(term)

      strictEqual(term.equals(resource.term), true)
      strictEqual((await resource.dataset()).size, 2)
      strictEqual([...resource.types][0].value, 'http://example.org/Class')
    })

    it('attaches quadStream getter to resource', async () => {
      const term = rdf.namedNode('http://example.org/')
      const store = new FlatMultiFileStore({
        baseIRI: 'http://example.org/',
        path: resolve(__dirname, 'support/store'),
      })
      const loader = new StoreResourceLoader({ store })

      const resource = await loader.load(term)
      const dataset = await rdf.dataset().import(resource.quadStream())

      strictEqual(term.equals(resource.term), true)
      strictEqual(dataset.size, 2)
      strictEqual([...resource.types][0].value, 'http://example.org/Class')
    })
  })

  describe('.forClassOperation', () => {
    it('should be a method', () => {
      const loader = new StoreResourceLoader({ store: {} })

      strictEqual(typeof loader.forClassOperation, 'function')
    })

    it('should load term, dataset and types from the given named graph', async () => {
      const term = rdf.namedNode('http://example.org/')
      const store = new FlatMultiFileStore({
        baseIRI: 'http://example.org/',
        path: resolve(__dirname, 'support/store'),
      })
      const loader = new StoreResourceLoader({ store })

      const resources = await loader.forClassOperation(term)
      const resource = resources[0]

      strictEqual(term.equals(resource.term), true)
      strictEqual((await resource.dataset()).size, 2)
      strictEqual([...resource.types][0].value, 'http://example.org/Class')
    })
  })

  describe('.forPropertyOperation', () => {
    it('should be a method', () => {
      const loader = new StoreResourceLoader({ store: {} })

      strictEqual(typeof loader.forPropertyOperation, 'function')
    })

    it('should load term, dataset and types from the given named graph', async () => {
      const term = rdf.namedNode('http://example.org/')
      const link = rdf.namedNode('http://example.org/object')
      const store = new FlatMultiFileStore({
        baseIRI: 'http://example.org/',
        path: resolve(__dirname, 'support/store'),
      })
      const loader = new StoreResourceLoader({ store })

      const resources = await loader.forPropertyOperation(link)
      const resource = resources[0]

      strictEqual(term.equals(resource.term), true)
      strictEqual((await resource.dataset()).size, 2)
      strictEqual([...resource.types][0].value, 'http://example.org/Class')
    })
  })
})
