import { expect } from 'chai'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import { createStore } from '../support/testData.js'
import { ex } from '../support/ns.js'

describe('lib/Kopflos', () => {
  const config: KopflosConfig = {
    sparql: {
      default: 'http://localhost:8080/sparql',
    },
  }

  before(createStore(import.meta.url))

  describe('constructor', () => {
    it('initializes pointer', async function () {
      // when
      const kopflos = new Kopflos(this.graph, config)

      // then
      expect(kopflos.apis.terms).to.deep.eq([ex.api1, ex.api2])
    })
  })

  describe('handleRequest', () => {
    it('returns 404 if no resource shape is found', async function () {
      // given
      const kopflos = new Kopflos(this.graph, config, {
        resourceShapeLookup: async () => [],
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
        headers: {},
      })

      // then
      expect(response).to.have.property('status', 404)
    })

    it('returns error if no resource loader is found', async function () {
      // given
      const kopflos = new Kopflos(this.graph, config, {
        resourceShapeLookup: async () => [{
          api: ex.api,
          resourceShape: ex.Shape,
        }],
        resourceLoaderLookup: async () => undefined,
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
        headers: {},
      })

      // then
      expect(response).to.be.an('error')
    })

    it('returns error if no handler is found', async function () {
      // given
      const kopflos = new Kopflos(this.graph, config, {
        resourceShapeLookup: async () => [{
          api: ex.api,
          resourceShape: ex.FooShape,
        }],
        handlerLookup: async () => undefined,
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
        headers: {},
      })

      // then
      expect(response).to.have.property('status', 405)
    })

    it('returns result from handler', async function () {
      // given
      const kopflos = new Kopflos(this.graph, config, {
        resourceShapeLookup: async () => [{
          api: ex.api,
          resourceShape: ex.FooShape,
        }],
        handlerLookup: async () => async () => ({
          status: 200,
          body: 'Foo',
        }),
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
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
