import rdf, { Environment } from '@zazuko/env-node'
import { expect } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import sinon from 'sinon'
import * as loader from '../../lib/resourceLoader.js'
import { ex } from '../support/ns.js'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import inMemoryClients from '../support/in-memory-clients.js'
import 'mocha-chai-rdf/snapshots.js'
import { findResourceLoader } from '../../lib/resourceLoader.js'
import type { KopflosEnvironment } from '../../lib/env/index.js'
import { createEnv } from '../../lib/env/index.js'

describe('lib/resourceLoader', () => {
  function config(ctx: Mocha.Context): KopflosConfig {
    return {
      sparql: {
        default: inMemoryClients(ctx.store),
      },
    }
  }

  describe('built-in loaders', () => {
    let kopflos: Kopflos

    beforeEach(createStore(import.meta.url, { format: 'trig', loadAll: true }))
    beforeEach(async function () {
      kopflos = new Kopflos(config(this))
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

  describe('findResourceLoader', () => {
    beforeEach(createStore(import.meta.url, { format: 'trig' }))

    class StubbedLoader {
      declare load: sinon.SinonStub

      init() {
        this.load = sinon.stub()
      }
    }

    let env: KopflosEnvironment
    beforeEach(function () {
      env = new Environment([StubbedLoader], { parent: createEnv(config(this)) })
    })

    context('when resource shape has a resource loader', () => {
      it('it will be used', async function () {
        // given
        const resourceShape = this.graph.node(ex.PersonShape)

        // when
        await findResourceLoader(resourceShape, env)

        // then
        expect(env.load).to.have.been.calledWith(sinon.match({
          term: ex.PersonResourceLoader,
        }))
      })
    })

    context('when resource shape has no resource loader', () => {
      it('API loader will be used', async function () {
        // given
        const resourceShape = this.graph.node(ex.PersonShape)

        // when
        await findResourceLoader(resourceShape, env)

        // then
        expect(env.load).to.have.been.calledWith(sinon.match({
          term: ex.ApiResourceLoader,
        }))
      })
    })

    context('when resource shape and API have no loaders', () => {
      it('loader from k:Config will be used', async function () {
        // given
        const resourceShape = this.graph.node(ex.PersonShape)

        // when
        await findResourceLoader(resourceShape, env)

        // then
        expect(env.load).to.have.been.calledWith(sinon.match({
          term: ex.ConfigResourceLoader,
        }))
      })
    })
  })
})
