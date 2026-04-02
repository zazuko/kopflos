import { Readable } from 'node:stream'
import { expect } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import * as oxigraph from 'oxigraph'
import rdf from '@zazuko/env-node'
import { createInMemoryClients } from '../index.js'

describe('@kopflos-cms/in-memory', function () {
  beforeEach(createStore(import.meta.url, { format: 'trig', loadAll: true }))

  describe('createInMemoryClients', function () {
    it('initializes clients', function () {
      // when
      const clients = createInMemoryClients(this.rdf.store)

      // then
      expect(clients.stream).to.be.ok
      expect(clients.parsed).to.be.ok
    })

    it('can query the store via parsed client', async function () {
      // given
      const clients = createInMemoryClients(this.rdf.store)

      // when
      const result = await clients.parsed.query.select('SELECT * WHERE { ?s ?p ?o }')

      // then
      expect(result.length).to.eq(1)
    })

    it('can query the store via stream client', async function () {
      // given
      const clients = createInMemoryClients(this.rdf.store)

      // when
      const result = clients.stream.query.select('SELECT * WHERE { ?s ?p ?o }')
      const dataset = await rdf.dataset().import(result)

      // then
      expect(dataset.size).to.eq(1)
    })

    it('can update the store', async function () {
      // given
      const clients = createInMemoryClients(this.rdf.store)
      const updateQuery = 'INSERT DATA { <http://example.com/s> <http://example.com/p> <http://example.com/o> }'

      // when
      await clients.parsed.query.update(updateQuery)
      const result = await clients.parsed.query.select('SELECT * WHERE { <http://example.com/s> ?p ?o }')

      // then
      expect(result).to.have.length(2)
    })

    it('queries named graphs via union default graph', async function () {
      // given
      const clients = createInMemoryClients(this.rdf.store)
      const g = oxigraph.namedNode('http://example.com/g')

      // when
      const result = await clients.parsed.query.select('SELECT * WHERE { ?s ?p ?o }')

      // then
      expect(result).to.have.length(1)
    })

    it('constructs from named graphs via union default graph', async function () {
      // given
      const clients = createInMemoryClients(this.rdf.store)

      // when
      const result = await clients.parsed.query.construct('CONSTRUCT WHERE { ?s ?p ?o }')

      // then
      const expected = rdf.quad(
        rdf.namedNode('http://example.com/s'),
        rdf.namedNode('http://example.com/p'),
        rdf.namedNode('http://example.com/o'),
      )
      expect(result.match(expected.subject, expected.predicate, expected.object)).to.have.property('size', 1)
    })

    describe('store', function () {
      it('can put triples into a graph', async function () {
        // given
        const clients = createInMemoryClients(this.rdf.store)
        const graph = oxigraph.namedNode('http://example.com/foo')
        const quad = oxigraph.quad(
          oxigraph.namedNode('http://example.com/s'),
          oxigraph.namedNode('http://example.com/p'),
          oxigraph.namedNode('http://example.com/o'),
          oxigraph.defaultGraph(),
        )
        const stream = Readable.from([quad])

        // when
        await clients.stream.store.put(stream, {
          graph,
        })

        // then
        const result = this.rdf.store.match(null, null, null, graph)
        expect(result).to.have.length(1)
      })

      it('put replaces triples in a graph', async function () {
        // given
        const clients = createInMemoryClients(this.rdf.store)
        const g = oxigraph.namedNode('http://example.com/g')
        const quad = oxigraph.quad(
          oxigraph.namedNode('http://example.com/new'),
          oxigraph.namedNode('http://example.com/p'),
          oxigraph.namedNode('http://example.com/o'),
          g,
        )
        const stream = Readable.from([quad])

        // when
        await clients.stream.store.put(stream, { graph: g })

        // then
        const result = this.rdf.store.match(null, null, null, g)
        expect(result).to.have.length(1)
        expect(result[0].subject.value).to.equal('http://example.com/new')
      })
    })
  })
})
