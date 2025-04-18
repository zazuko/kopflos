import rdf from '@zazuko/env-node'
import { expect } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import defaultResourceShapeLookup from '../../lib/resourceShape.js'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'
import { ex } from '../../../testing-helpers/ns.js'

describe('lib/resourceShape', function () {
  let options: KopflosConfig

  beforeEach(createStore(import.meta.url, { format: 'trig' }))

  beforeEach(async function () {
    options = {
      baseIri: 'http://example.com',
      sparql: {
        default: inMemoryClients(this.rdf),
      },
    }
  })

  describe('default resource shape lookup', function () {
    context('when directly matching resource shape is available', function () {
      it('is found by resource IRI', async function () {
        // given
        const kopflos = new Kopflos(options)

        // when
        const results = await defaultResourceShapeLookup(ex.bar, kopflos)

        // then
        expect(results[0]).to.deep.contain({
          api: ex.api,
          resourceShape: ex.barShape,
          subject: ex.bar,
        })
        expect(results).to.have.length(1)
      })

      it('does not find anything when requested resource does not match that shape', async function () {
        // given
        const kopflos = new Kopflos(options)

        // when
        const results = await defaultResourceShapeLookup(ex.boo, kopflos)

        // then
        expect(results).to.be.empty
      })
    })

    context('when class targeting resource shape is available', function () {
      it('is found when requested resource has that type', async function () {
        // given
        const kopflos = new Kopflos(options)

        // when
        const results = await defaultResourceShapeLookup(ex.foo, kopflos)

        // then
        expect(results[0]).to.deep.contain({
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.foo,
        })
        expect(results).to.have.length(1)
      })

      it('is found when requested resource has derived type', async function () {
        // given
        const kopflos = new Kopflos(options)

        // when
        const results = await defaultResourceShapeLookup(ex.baz, kopflos)

        // then
        expect(results[0]).to.deep.contain({
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.baz,
        })
        expect(results).to.have.length(1)
      })

      it('find nothing when a resource exists but has a different type', async function () {
        // given
        const kopflos = new Kopflos(options)

        // when
        const results = await defaultResourceShapeLookup(ex.xyz, kopflos)

        // then
        expect(results).to.be.empty
      })
    })

    context('when class targeting resource shapes has property shape', function () {
      it('finds matching resource by property usage of class targeting shape', async function () {
        // given
        const kopflos = new Kopflos(options)

        // when
        const results = await defaultResourceShapeLookup(ex['foo/location'], kopflos)

        // then
        expect(results[0]).to.deep.contain({
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.foo,
          object: ex['foo/location'],
          property: rdf.ns.schema.location,
        })
        expect(results).to.have.length(1)
      })
    })

    context('when node targeting resource shapes has property shape', function () {
      it('finds matching resource by property usage of resource shape with target node', async function () {
        // given
        const kopflos = new Kopflos(options)

        // when
        const results = await defaultResourceShapeLookup(ex['foo/location'], kopflos)

        // then
        expect(results[0]).to.deep.contain({
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.foo,
          object: ex['foo/location'],
          property: rdf.ns.schema.location,
        })
        expect(results).to.have.length(1)
      })
    })

    context('when resource is matched against pattern', function () {
      it('extracts variables', async function () {
        // given
        const kopflos = new Kopflos(options)

        // when
        const [result, ...more] = await defaultResourceShapeLookup(ex['foo/bar'], kopflos)

        // then
        expect(result).to.deep.contain({
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex['foo/bar'],
        })
        expect(result).to.have.property('subjectVariables').that.deep.equals(new Map([
          ['bar', 'bar'],
        ]))
        expect(more).to.be.empty
      })
    })
  })
})
