import rdf from '@zazuko/env-node'
import { expect } from 'chai'
import defaultResourceShapeLookup from '../../lib/resourceShape.js'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import inMemoryClients from '../support/in-memory-clients.js'
import { ex } from '../support/ns.js'
import { createStore } from '../support/testData.js'

describe('lib/resourceShape', () => {
  let options: KopflosConfig

  beforeEach(createStore(import.meta.url, { format: 'trig' }))
  beforeEach(async function () {
    options = {
      sparql: {
        default: inMemoryClients(this.store!),
      },
    }
  })

  describe('default resource shape lookup', () => {
    it('finds directly matching resource', async () => {
      // given
      const kopflos = new Kopflos(rdf.clownface(), options)

      // when
      const results = await defaultResourceShapeLookup(ex.bar, kopflos)

      // then
      expect(results[0]).to.deep.contain({
        api: ex.api,
        resourceShape: ex.barShape,
      })
      expect(results).to.have.length(1)
    })

    it('finds matching resource by type', async () => {
      // given
      const kopflos = new Kopflos(rdf.clownface(), options)

      // when
      const results = await defaultResourceShapeLookup(ex.foo, kopflos)

      // then
      expect(results[0]).to.deep.contain({
        api: ex.api,
        resourceShape: ex.FooShape,
        type: ex.Foo,
      })
      expect(results).to.have.length(1)
    })

    it('finds matching resource by super type', async () => {
      // given
      const kopflos = new Kopflos(rdf.clownface(), options)

      // when
      const results = await defaultResourceShapeLookup(ex.baz, kopflos)

      // then
      expect(results[0]).to.deep.contain({
        api: ex.api,
        resourceShape: ex.FooShape,
        type: ex.Baz,
      })
      expect(results).to.have.length(1)
    })

    it('finds matching resource by property usage', async () => {
      // given
      const kopflos = new Kopflos(rdf.clownface(), options)

      // when
      const results = await defaultResourceShapeLookup(ex['foo/location'], kopflos)

      // then
      expect(results[0]).to.deep.contain({
        api: ex.api,
        resourceShape: ex.FooShape,
        type: ex.Foo,
        parent: ex.foo,
        property: rdf.ns.schema.location,
      })
      expect(results).to.have.length(1)
    })
  })
})
