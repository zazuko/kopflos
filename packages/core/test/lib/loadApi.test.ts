import { createStore } from 'mocha-chai-rdf/store.js'
import { expect } from 'chai'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import { ex } from '../../../testing-helpers/ns.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'

describe('loadApi', function () {
  let config: KopflosConfig

  beforeEach(createStore(import.meta.url, { format: 'trig', loadAll: true }))

  beforeEach(function () {
    config = {
      basePath: import.meta.dirname,
      baseIri: 'http://example.com/',
      sparql: {
        default: inMemoryClients(this.rdf),
      },
    }
  })

  describe('loadGraphs', function () {
    it('fetches combined graph contents', async function () {
      // given
      const kopflos = new Kopflos({
        ...config,
        apiGraphs: [ex.PublicApi, ex.PrivateApi],
      })

      // when
      await kopflos.loadApiGraphs()

      // then
      expect(kopflos.dataset).to.have.property('size', 11)
    })

    it('fetches combined graph contents (string names)', async function () {
      // given
      const kopflos = new Kopflos({
        ...config,
        apiGraphs: ['http://example.org/PublicApi', 'http://example.org/PrivateApi'],
      })

      // when
      await kopflos.loadApiGraphs()

      // then
      expect(kopflos.dataset).to.have.property('size', 11)
    })
  })
})
