import { createStore } from 'mocha-chai-rdf/store.js'
import { expect } from 'chai'
import rdf from '@zazuko/env-node'
import { code } from '@zazuko/vocabulary-extras-builders'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import { ex, kopflos } from '../../../testing-helpers/ns.js'
import * as resourceLoaders from '../../resourceLoaders.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'

describe('loadApi', () => {
  let config: KopflosConfig

  beforeEach(createStore(import.meta.url, { format: 'trig', loadAll: true }))
  beforeEach(function () {
    config = {
      baseIri: 'http://example.com/',
      sparql: {
        default: inMemoryClients(this.rdf),
      },
    }
  })

  describe('fromGraphs', () => {
    it('fetches combined graph contents', async () => {
      // given
      const kopfos = new Kopflos(config)

      // when
      await Kopflos.fromGraphs(kopfos, ex.PublicApi, ex.PrivateApi)

      // then
      expect(kopfos.dataset).to.have.property('size', 15)
    })

    it('fetches combined graph contents (string names)', async () => {
      // given
      const kopfos = new Kopflos(config)

      // when
      await Kopflos.fromGraphs(kopfos, 'http://example.org/PublicApi', 'http://example.org/PrivateApi')

      // then
      expect(kopfos.dataset).to.have.property('size', 15)
    })

    const shorthands = rdf.termMap([
      [kopflos.DescribeLoader, resourceLoaders.describe],
      [kopflos.OwnGraphLoader, resourceLoaders.fromOwnGraph],
    ])
    for (const [shorthand, implementation] of shorthands) {
      context(`inserts ${shorthand.value} shorthand`, () => {
        it('which has correct type', async () => {
          // given
          const instance = new Kopflos(config)

          // when
          await Kopflos.fromGraphs(instance, ex.PublicApi, ex.PrivateApi)

          // then
          const type = instance.graph.node(shorthand).out(rdf.ns.rdf.type)
          expect(type).to.eq(code.EcmaScriptModule)
        })

        it('which can be loaded', async () => {
          // given
          const instance = new Kopflos(config)

          // when
          await Kopflos.fromGraphs(instance, ex.PublicApi, ex.PrivateApi)

          // then
          const loadedFunc = await instance.env.load(instance.graph.node(shorthand))
          expect(loadedFunc).to.eq(implementation)
        })
      })
    }
  })
})
