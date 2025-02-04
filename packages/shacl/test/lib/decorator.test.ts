import type { HandlerArgs, KopflosEnvironment } from '@kopflos-cms/core'
import { expect } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import sinon from 'sinon'
// eslint-disable-next-line import/no-unresolved
import { createEnv } from '@kopflos-cms/core/env.js'
import { decorator } from '../../lib/decorator.js'
import { ex } from '../../../testing-helpers/ns.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'

describe('@kopflos-cms/shacl/lib/decorator.js', () => {
  let env: KopflosEnvironment

  beforeEach(createStore(import.meta.url, {
    format: 'trig',
    loadAll: true,
  }))

  beforeEach(function () {
    env = createEnv({
      baseIri: 'http://localhost:1429/',
      sparql: {
        default: inMemoryClients(this.rdf),
      },
    })
  })

  describe('decorator', () => {
    describe('.applicable', () => {
      it('returns false when args.body is not RDF', async () => {
        // given
        const req = <HandlerArgs>{
          env,
          body: {
            isRDF: false,
          },
        }

        // when
        const result = await decorator.applicable!(req)

        // then
        expect(result).to.be.false
      })

      it('returns false when handler has no dash:shape', async function () {
        // given
        const req = <HandlerArgs>{
          env,
          resourceShape: this.rdf.graph.node(ex.noValidation),
          method: 'PUT',
          body: {
            isRDF: true,
          },
        }

        // when
        const result = await decorator.applicable!(req)

        // then
        expect(result).to.be.false
      })

      it('returns true when handler has a single dash:shape', async function () {
        // given
        const req = <HandlerArgs>{
          env,
          resourceShape: this.rdf.graph.node(ex.oneShape),
          method: 'PUT',
          body: {
            isRDF: true,
          },
        }

        // when
        const result = await decorator.applicable!(req)

        // then
        expect(result).to.be.true
      })

      it('returns true when handler has a multiple dash:shape', async function () {
        // given
        const req = <HandlerArgs>{
          env,
          resourceShape: this.rdf.graph.node(ex.twoShapes),
          method: 'PUT',
          body: {
            isRDF: true,
          },
        }

        // when
        const result = await decorator.applicable!(req)

        // then
        expect(result).to.be.true
      })
    })

    describe('when called', () => {
      it('calls next when validation passes', async function () {
        // given
        const req = <HandlerArgs>{
          env,
          resourceShape: this.rdf.graph.node(ex.oneShape),
          method: 'PUT',
          body: {
            isRDF: true,
          },
        }
        const mockValidation = sinon.stub()
          .resolves({
            conforms: true,
          })

        // when
        const result = await decorator(req, () => Promise.resolve({ status: 200, body: 'OK' }), mockValidation)

        // then
        expect(result).to.deep.equal({ status: 200, body: 'OK' })
      })

      it('returns Bad Request when validation fails', async function () {
        // given
        const req = <HandlerArgs>{
          env,
          resourceShape: this.rdf.graph.node(ex.oneShape),
          method: 'PUT',
          body: {
            isRDF: true,
          },
        }
        const mockValidation = sinon.stub()
          .resolves({
            conforms: false,
          })

        // when
        const result = await decorator(req, () => Promise.resolve({ status: 200, body: 'OK' }), mockValidation)

        // then
        expect(result).to.have.property('status', 400)
      })
    })
  })
})
