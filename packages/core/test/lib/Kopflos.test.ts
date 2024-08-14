import { expect } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import 'mocha-chai-rdf/snapshots.js'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import { ex } from '../support/ns.js'
import type { ResourceShapeObjectMatch } from '../../lib/resourceShape.js'
import type { Handler } from '../../lib/handler.js'

describe('lib/Kopflos', () => {
  const config: KopflosConfig = {
    sparql: {
      default: 'http://localhost:8080/sparql',
    },
  }

  before(createStore(import.meta.url, { format: 'trig', includeDefaultGraph: true }))

  describe('constructor', () => {
    it('initializes pointer', async function () {
      // when
      const kopflos = new Kopflos(config, {
        dataset: this.dataset,
      })

      // then
      expect(kopflos.apis.terms).to.deep.eq([ex.api1, ex.api2])
    })
  })

  describe('handleRequest', () => {
    it('returns 404 if no resource shape is found', async function () {
      // given
      const kopflos = new Kopflos(config, {
        dataset: this.dataset,
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

    it('returns error if no handler is found', async function () {
      // given
      const kopflos = new Kopflos(config, {
        dataset: this.dataset,
        resourceShapeLookup: async () => [{
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.foo,
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
      const kopflos = new Kopflos(config, {
        dataset: this.dataset,
        resourceShapeLookup: async () => [{
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.foo,
        }],
        handlerLookup: async () => testHandler,
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
        headers: {},
      })

      // then
      expect(response).toMatchSnapshot()
    })

    describe('property handlers', () => {
      it('returns result from handler', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.dataset,
          resourceShapeLookup: async () => [<ResourceShapeObjectMatch>{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
            property: ex.bar,
            object: ex.baz,
          }],
          handlerLookup: async () => testHandler,
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.baz,
          headers: {},
        })

        // then
        expect(response).toMatchSnapshot()
      })
    })
  })
})

const testHandler: Handler = ({ subject, property, object }) => ({
  status: 200,
  body: JSON.stringify({
    subject: subject.value,
    property: property?.value,
    object: object?.value,
  }, null, 2),
})
