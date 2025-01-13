import * as fs from 'node:fs'
import type { Body, KopflosConfig, ResultEnvelope } from '@kopflos-cms/core'
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

      context('collection paged', () => {
        let res: ResultEnvelope

        context('with limit/offset', () => {
          const collection = ex['municipalities/limit-offset']

          context('limit and offset given', () => {
            beforeEach(async function () {
              // given
              const kopflos = await startKopflos()

              // when
              res = await kopflos.handleRequest({
                method: 'GET',
                iri: collection,
                headers: {},
                query: {
                  limit: '10',
                  offset: '40',
                },
                body: {} as Body,
              })
            })

            it('returns subset of results', async function () {
              // then
              const dataset = await $rdf.dataset().import(res.body as Stream)
              const pointer = $rdf.clownface({ dataset }).node(collection)
              expect(pointer.out(ns.hydra.member).terms).to.have.length(10)
              expect(pointer.out(ns.hydra.totalItems).term).to.deep.eq(toRdf(3449))
            })

            it('includes next page link', async () => {
              // then
              const dataset = await $rdf.dataset().import(res.body as Stream)
              const pointer = $rdf.clownface({ dataset }).node(collection)
              expect(pointer.out(ns.hydra.view).out(ns.hydra.next).term)
                .to.deep.eq(ex['municipalities/limit-offset?limit=10&offset=50'])
            })

            it('includes previous page link', async () => {
              // then
              const dataset = await $rdf.dataset().import(res.body as Stream)
              const pointer = $rdf.clownface({ dataset }).node(collection)
              expect(pointer.out(ns.hydra.view).out(ns.hydra.previous).term)
                .to.deep.eq(ex['municipalities/limit-offset?limit=10&offset=30'])
            })

            it('includes first page link', async () => {
              // then
              const dataset = await $rdf.dataset().import(res.body as Stream)
              const pointer = $rdf.clownface({ dataset }).node(collection)
              expect(pointer.out(ns.hydra.view).out(ns.hydra.first).term)
                .to.deep.eq(ex['municipalities/limit-offset?limit=10&offset=0'])
            })

            it('includes last page link', async () => {
              // then
              const dataset = await $rdf.dataset().import(res.body as Stream)
              const pointer = $rdf.clownface({ dataset }).node(collection)
              expect(pointer.out(ns.hydra.view).out(ns.hydra.last).term)
                .to.deep.eq(ex['municipalities/limit-offset?limit=10&offset=3440'])
            })
          })

          context('only limit given', () => {
            beforeEach(async function () {
              // given
              const kopflos = await startKopflos()

              // when
              res = await kopflos.handleRequest({
                method: 'GET',
                iri: collection,
                headers: {},
                query: {
                  limit: '10',
                },
                body: {} as Body,
              })
            })

            it('returns subset of results', async function () {
              // then
              const dataset = await $rdf.dataset().import(res.body as Stream)
              const pointer = $rdf.clownface({ dataset }).node(collection)
              expect(pointer.out(ns.hydra.member).terms).to.have.length(10)
              expect(pointer.out(ns.hydra.totalItems).term).to.deep.eq(toRdf(3449))
            })
          })

          context('only offset given', () => {
            beforeEach(async function () {
              // given
              const kopflos = await startKopflos()

              // when
              res = await kopflos.handleRequest({
                method: 'GET',
                iri: collection,
                headers: {},
                query: {
                  offset: '10',
                },
                body: {} as Body,
              })
            })

            it('returns subset of results', async function () {
              // then
              const dataset = await $rdf.dataset().import(res.body as Stream)
              const pointer = $rdf.clownface({ dataset }).node(collection)
              expect(pointer.out(ns.hydra.member).terms).to.have.length(3439)
              expect(pointer.out(ns.hydra.totalItems).term).to.deep.eq(toRdf(3449))
            })
          })
        })

        context('with page index', () => {
          const collection = ex['municipalities/paged']

          context('page index given', () => {
            beforeEach(async function () {
              // given
              const kopflos = await startKopflos()

              // when
              res = await kopflos.handleRequest({
                method: 'GET',
                iri: collection,
                headers: {},
                query: {
                  page: '10',
                },
                body: {} as Body,
              })
            })

            it('returns subset of results', async function () {
              // then
              const dataset = await $rdf.dataset().import(res.body as Stream)
              const pointer = $rdf.clownface({ dataset }).node(collection)
              expect(pointer.out(ns.hydra.member).terms).to.have.length(20)
              expect(pointer.out(ns.hydra.totalItems).term).to.deep.eq(toRdf(3449))
            })
          })

          context('page index not given', () => {
            beforeEach(async function () {
              // given
              const kopflos = await startKopflos()

              // when
              res = await kopflos.handleRequest({
                method: 'GET',
                iri: collection,
                headers: {},
                query: {},
                body: {} as Body,
              })
            })

            it('returns subset of results', async function () {
              // then
              const dataset = await $rdf.dataset().import(res.body as Stream)
              const pointer = $rdf.clownface({ dataset }).node(collection)
              expect(pointer.out(ns.hydra.member).terms).to.have.length(20)
              expect(pointer.out(ns.hydra.totalItems).term).to.deep.eq(toRdf(3449))
            })
          })
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
