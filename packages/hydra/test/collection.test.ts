import * as fs from 'node:fs'
import type { Body, KopflosConfig } from '@kopflos-cms/core'
import Kopflos from '@kopflos-cms/core'
import { createStore } from 'mocha-chai-rdf/store.js'
import $rdf from '@zazuko/env-node'
import { expect } from 'chai'
import type { Stream } from '@rdfjs/types'
import * as ns from '@tpluscode/rdf-ns-builders'
import { toRdf } from 'rdf-literal'
import inMemoryClients from '../../testing-helpers/in-memory-clients.js'
import hydra from '../index.js'

const baseIri = 'http://example.org'
const ex = $rdf.namespace(baseIri + '/')

describe('@kopflos-cms/hydra', () => {
  beforeEach(createStore(import.meta.url, {
    format: 'trig',
    loadAll: true,
  }))

  let config: KopflosConfig
  beforeEach(function () {
    this.rdf.store.load(fs.readFileSync(new URL('./data/municipalities.ttl', import.meta.url)).toString(), {
      format: 'text/turtle',
    })
    this.rdf.store.load(fs.readFileSync(new URL('./data/districts.ttl', import.meta.url)).toString(), {
      format: 'text/turtle',
    })

    config = {
      baseIri,
      sparql: {
        default: inMemoryClients(this.rdf),
        lindas: 'https://lindas.admin.ch/query',
      },
    }
  })

  async function startKopflos({ apis = [ex('readonly-api')] } = {}) {
    const kopflos = new Kopflos({
      ...config,
      apiGraphs: apis.map(api => api.value),
    }, {
      plugins: [hydra({
        apis,
      })],
    })
    await kopflos.start()
    await kopflos.loadApiGraphs()

    return kopflos
  }

  describe('hydra:Collection', () => {
    context('get', () => {
      context('when collection has no memberAssertion', () => {
        it('should return 500', async function () {
          // given
          const kopflos = await startKopflos()

          // when
          const res = await kopflos.handleRequest({
            method: 'GET',
            iri: ex['municipalities/no-assertions'],
            headers: {},
            query: {},
            body: {} as Body,
          })

          // then
          expect(res.status).to.equal(500)
        })
      })

      context('when collection is not readable', () => {
        it('should return 405', async function () {
          // given
          const kopflos = await startKopflos()

          // when
          const res = await kopflos.handleRequest({
            method: 'GET',
            iri: ex['municipalities/readable-false'],
            headers: {},
            query: {},
            body: {} as Body,
          })

          // then
          expect(res.status).to.equal(405)
        })
      })

      context('when collection has single memberAssertion', () => {
        it('should return a stream of members', async function () {
          // given
          const kopflos = await startKopflos()

          // when
          const collection = ex['municipalities/all']
          const res = await kopflos.handleRequest({
            method: 'GET',
            iri: collection,
            headers: {},
            query: {},
            body: {} as Body,
          })

          // then
          const dataset = await $rdf.dataset().import(res.body as Stream)
          const pointer = $rdf.clownface({ dataset }).node(collection)
          expect(pointer.out(ns.hydra.member).terms).to.have.length(3449)
          expect(pointer.out(ns.hydra.totalItems).term).to.deep.eq(toRdf(3449))
        })
      })

      context('when collection has multiple memberAssertion', () => {
        it('should return a stream of members', async function () {
          // given
          const kopflos = await startKopflos()

          // when
          const collection = ex['municipalities/from-static-district']
          const res = await kopflos.handleRequest({
            method: 'GET',
            iri: collection,
            headers: {},
            query: {},
            body: {} as Body,
          })

          // then
          const dataset = await $rdf.dataset().import(res.body as Stream)
          const pointer = $rdf.clownface({ dataset }).node(collection)
          expect(pointer.out(ns.hydra.member).terms).to.have.length(14)
          expect(pointer.out(ns.hydra.totalItems).term).to.deep.eq(toRdf(14))
        })
      })

      context('when collection is sourced from another endpoint', () => {
        it('should return a stream of members', async function () {
          // given
          const kopflos = await startKopflos()

          // when
          const collection = ex['countries/from-lindas']
          const res = await kopflos.handleRequest({
            method: 'GET',
            iri: collection,
            headers: {},
            query: {},
            body: {} as Body,
          })

          // then
          const dataset = await $rdf.dataset().import(res.body as Stream)
          const pointer = $rdf.clownface({ dataset }).node(collection)
          expect(pointer.out(ns.hydra.member).terms).to.have.length.above(200)
        })

        it('should fail when endpoint is not configured', async function () {
          // given
          const kopflos = await startKopflos()

          // when
          const collection = ex['countries/wrong-endpoint']
          const res = await kopflos.handleRequest({
            method: 'GET',
            iri: collection,
            headers: {},
            query: {},
            body: {} as Body,
          })

          // then
          expect(res.status).to.equal(500)
        })
      })
    })

    context('post', () => {
      context('when collection is not writable', () => {
        it('should return 405', async function () {
          // given
          const kopflos = await startKopflos()

          // when
          const res = await kopflos.handleRequest({
            method: 'POST',
            iri: ex['municipalities/writable-false'],
            headers: {},
            query: {},
            body: {} as Body,
          })

          // then
          expect(res.status).to.equal(405)
        })
      })
    })
  })
})
