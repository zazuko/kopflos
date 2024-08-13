import { createStore } from 'mocha-chai-rdf/store.js'
import { parsingClient, streamClient } from 'mocha-chai-rdf/sparql-clients.js'
import { expect } from 'chai'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import { ex } from '../support/ns.js'

describe('loadApi', () => {
  let config: KopflosConfig

  beforeEach(createStore(import.meta.url, { format: 'trig', loadAll: true }))
  beforeEach(function () {
    config = {
      sparql: {
        default: {
          parsed: parsingClient(this.store),
          stream: streamClient(this.store),
        },
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
      expect(kopfos.dataset).to.have.property('size', 11)
    })

    it('fetches combined graph contents (string names)', async () => {
      // given
      const kopfos = new Kopflos(config)

      // when
      await Kopflos.fromGraphs(kopfos, 'http://example.org/PublicApi', 'http://example.org/PrivateApi')

      // then
      expect(kopfos.dataset).to.have.property('size', 11)
    })
  })
})
