import type { HandlerArgs, KopflosEnvironment, Plugins } from '@kopflos-cms/core'
import { expect } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import sinon from 'sinon'
// eslint-disable-next-line import/no-unresolved
import { createEnv } from '@kopflos-cms/core/env.js'
import Kopflos from '@kopflos-cms/core'
// eslint-disable-next-line import/no-unresolved
import { kl } from '@kopflos-cms/core/ns.js'
import ShaclDecorator from '../../lib/decorator.js'
import { ex } from '../../../testing-helpers/ns.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'
import type { ShaclPlugin } from '../../index.js'

describe('@kopflos-cms/shacl/lib/decorator.js', function () {
  let env: KopflosEnvironment
  let decorator: () => ShaclDecorator
  let plugin: ShaclPlugin

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

    plugin = {
      options: {},
    }
    const kopflos = sinon.createStubInstance(Kopflos, {
      getPlugin: sinon.stub<[name: keyof Plugins], ShaclPlugin | undefined>().callsFake(() => plugin),
    })
    decorator = () => new ShaclDecorator(kopflos)
  })

  describe('decorator', function () {
    describe('.applicable', function () {
      it('returns false when args.body is not RDF', async function () {
        // given
        const req = <HandlerArgs>{
          env,
          body: {
            isRDF: false,
          },
        }

        // when
        const result = await decorator().applicable!(req)

        // then
        expect(result).to.be.false
      })

      it('returns false when handler has no sh:shapesGraph', async function () {
        // given
        const resourceShape = this.rdf.graph.node(ex.noValidation)
        const req = <HandlerArgs>{
          env,
          resourceShape,
          handler: resourceShape.out(kl.handler),
          method: 'PUT',
          body: {
            isRDF: true,
          },
        }

        // when
        const result = await decorator().applicable!(req)

        // then
        expect(result).to.be.false
      })

      it('returns true when handler has a single sh:shapesGraph', async function () {
        // given
        const resourceShape = this.rdf.graph.node(ex.oneShape)
        const req = <HandlerArgs>{
          env,
          resourceShape,
          handler: resourceShape.out(kl.handler),
          method: 'PUT',
          body: {
            isRDF: true,
          },
        }

        // when
        const result = await decorator().applicable!(req)

        // then
        expect(result).to.be.true
      })

      it('returns true when handler has a multiple sh:shapesGraph', async function () {
        // given
        const resourceShape = this.rdf.graph.node(ex.twoShapes)
        const req = <HandlerArgs>{
          env,
          resourceShape,
          handler: resourceShape.out(kl.handler),
          method: 'PUT',
          body: {
            isRDF: true,
          },
        }

        // when
        const result = await decorator().applicable!(req)

        // then
        expect(result).to.be.true
      })
    })

    describe('when called', function () {
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
        const result = await decorator().run(req, () => Promise.resolve({ status: 200, body: 'OK' }), mockValidation)

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
        const result = await decorator().run(req, () => Promise.resolve({ status: 200, body: 'OK' }), mockValidation)

        // then
        expect(result).to.have.property('status', 400)
      })

      it('uses configured override to load data graph', async function () {
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
        const loadDataGraph = sinon.stub()
        plugin = {
          options: {
            loadDataGraph,
          },
        }

        // when
        await decorator().run(req, () => Promise.resolve({ status: 200, body: 'OK' }), mockValidation)

        // then
        expect(mockValidation).to.have.been.calledWith(req, loadDataGraph)
      })
    })
  })
})
