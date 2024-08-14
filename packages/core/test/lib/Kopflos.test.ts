import { expect } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import 'mocha-chai-rdf/snapshots.js'
import rdf from '@zazuko/env-node'
import type { Stream } from '@rdfjs/types'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import { ex } from '../support/ns.js'
import type { ResourceShapeObjectMatch } from '../../lib/resourceShape.js'
import type { Handler } from '../../lib/handler.js'
import HttpMethods from '../../lib/httpMethods.js'

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
        method: 'GET',
        headers: {},
      })

      // then
      expect(response).to.have.property('status', 404)
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
        method: 'GET',
        headers: {},
      })

      // then
      expect(response).toMatchSnapshot()
    })

    context('when no handler is found', () => {
      for (const method of ['GET', 'HEAD'] as const) {
        context('when method is ' + method, () => {
          it('forwards core representation', async function () {
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
              method,
              headers: {},
            }) as unknown as { status: number; body: Stream }

            // then
            expect(response).to.have.property('status', 200)
            const dataset = await rdf.dataset().import(response.body)
            expect(dataset).canonical.toMatchSnapshot()
          })
        })
      }

      for (const method of HttpMethods.filter(m => m !== 'GET' && m !== 'HEAD')) {
        context('when method is ' + method, () => {
          it('returns error', async function () {
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
              method,
              headers: {},
            })

            // then
            expect(response).to.have.property('status', 405)
          })
        })
      }
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
          method: 'GET',
          headers: {},
        })

        // then
        expect(response).toMatchSnapshot()
      })

      context('when no handler is found', () => {
        for (const method of HttpMethods) {
          context('when method is ' + method, () => {
            it('returns 405', async function () {
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
                handlerLookup: async () => undefined,
              })

              // when
              const response = await kopflos.handleRequest({
                iri: ex.baz,
                method,
                headers: {},
              })

              // then
              expect(response.status).to.eq(405)
            })
          })
        }
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
