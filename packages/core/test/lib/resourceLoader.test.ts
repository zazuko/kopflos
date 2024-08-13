import rdf from '@zazuko/env-node'
import { expect } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import * as loader from '../../lib/resourceLoader.js'
import { ex } from '../support/ns.js'
import Kopflos from '../../lib/Kopflos.js'
import inMemoryClients from '../support/in-memory-clients.js'
import 'mocha-chai-rdf/snapshots.js'

describe('lib/resourceLoader', () => {
  beforeEach(createStore(import.meta.url, { format: 'trig', loadAll: true }))

  let kopflos: Kopflos
  beforeEach(async function () {
    kopflos = new Kopflos({
      sparql: {
        default: inMemoryClients(this.store),
      },
    })
  })

  describe('describe', () => {
    it('should return a stream of a DESCRIBE query', async () => {
      // when
      const dataset = await rdf.dataset().import(loader.describe(ex.foo, kopflos))

      // then
      expect(dataset).canonical.toMatchSnapshot()
    })
  })

  describe('fromOwnGraph', () => {
    it('should contents of correct graph', async () => {
      // when
      const dataset = await rdf.dataset().import(loader.fromOwnGraph(ex.foo, kopflos))

      // then
      expect(dataset).canonical.toMatchSnapshot()
    })
  })
})
