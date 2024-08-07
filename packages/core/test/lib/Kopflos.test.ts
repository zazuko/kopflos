import rdf from '@zazuko/env-node'
import { expect } from 'chai'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'

describe('lib/Kopflos', () => {
  const config: KopflosConfig = {
    sparql: {
      default: 'http://localhost:8080/sparql',
    },
  }

  describe('constructor', () => {
    it('initializes pointer', async () => {
      // given
      const graph = rdf.clownface({
        dataset: await rdf.dataset().import(rdf.fromFile('test/assets/api.ttl')),
      })

      // when
      const kopflos = new Kopflos(graph, config)

      // then
      expect(kopflos.apis.terms).to.deep.eq([
        rdf.namedNode('https://example.com/api1'),
        rdf.namedNode('https://example.org/api2'),
      ])
    })
  })

  describe('handleRequest', () => {
    it('returns 404 if no resource shape is found', async () => {
      // given
      const graph = rdf.clownface({
        dataset: await rdf.dataset().import(rdf.fromFile('test/assets/api.ttl')),
      })
      const kopflos = new Kopflos(graph, config, {
        resourceShapeLookup: async () => [],
      })

      // when
      const response = await kopflos.handleRequest({
        iri: rdf.namedNode('https://example.com/'),
        headers: {},
      })

      // then
      expect(response).to.have.property('status', 404)
    })

    it('returns error if no resource loader is found', async () => {
      // given
      const graph = rdf.clownface({
        dataset: await rdf.dataset().import(rdf.fromFile('test/assets/api.ttl')),
      })
      const kopflos = new Kopflos(graph, config, {
        resourceShapeLookup: async () => [{
          api: rdf.namedNode('https://example.com/api'),
          resourceShape: rdf.namedNode('https://example.com/'),
        }],
        resourceLoaderLookup: async () => undefined,
      })

      // when
      const response = await kopflos.handleRequest({
        iri: rdf.namedNode('https://example.com/'),
        headers: {},
      })

      // then
      expect(response).to.be.an('error')
    })

    it('returns error if no handler is found', async () => {
      // given
      const graph = rdf.clownface({
        dataset: await rdf.dataset().import(rdf.fromFile('test/assets/api.ttl')),
      })
      const kopflos = new Kopflos(graph, config, {
        resourceShapeLookup: async () => [{
          api: rdf.namedNode('https://example.com/api'),
          resourceShape: rdf.namedNode('https://example.com/FooShape'),
        }],
        handlerLookup: async () => undefined,
      })

      // when
      const response = await kopflos.handleRequest({
        iri: rdf.namedNode('https://example.com/foo'),
        headers: {},
      })

      // then
      expect(response).to.have.property('status', 405)
    })

    it('returns result from handler', async () => {
      // given
      const graph = rdf.clownface({
        dataset: await rdf.dataset().import(rdf.fromFile('test/assets/api.ttl')),
      })
      const kopflos = new Kopflos(graph, config, {
        resourceShapeLookup: async () => [{
          api: rdf.namedNode('https://example.com/api'),
          resourceShape: rdf.namedNode('https://example.com/FooShape'),
        }],
        handlerLookup: async () => async () => ({
          status: 200,
          body: 'Foo',
        }),
      })

      // when
      const response = await kopflos.handleRequest({
        iri: rdf.namedNode('https://example.com/foo'),
        headers: {},
      })

      // then
      expect(response).to.deep.eq({
        status: 200,
        body: 'Foo',
      })
    })
  })
})
