import { Readable } from 'node:stream'
import { expect } from 'chai'
import * as oxigraph from 'oxigraph'
import { createOxigraphClients } from '../lib/OxigraphSparqlClient.js'

describe('@kopflos-cms/in-memory', function () {
  describe('createOxigraphClients', function () {
    let store: oxigraph.Store

    beforeEach(function () {
      store = new oxigraph.Store()
    })

    it('initializes clients', function () {
      // when
      const clients = createOxigraphClients(store)

      // then
      expect(clients.stream).to.be.ok
      expect(clients.parsed).to.be.ok
    })

    it('can query the store via parsed client', async function () {
      // given
      const clients = createOxigraphClients(store)

      // when
      const result = await clients.parsed.query.select('SELECT * WHERE { ?s ?p ?o }')

      // then
      expect(result).to.be.an('array')
    })

    it('can query the store via stream client', async function () {
      // given
      const clients = createOxigraphClients(store)

      // when
      const result = await clients.stream.query.select('SELECT * WHERE { ?s ?p ?o }')

      // then
      expect(result).to.be.ok
      // result is a stream
    })

    it('can update the store', async function () {
      // given
      const clients = createOxigraphClients(store)
      const updateQuery = 'INSERT DATA { <http://example.com/s> <http://example.com/p> <http://example.com/o> }'

      // when
      await clients.parsed.query.update(updateQuery)
      const result = await clients.parsed.query.select('SELECT * WHERE { <http://example.com/s> ?p ?o }')

      // then
      expect(result).to.have.length(1)
    })

    describe('store', function () {
      it('can put triples into a graph', async function () {
        // given
        const clients = createOxigraphClients(store)
        const quad = oxigraph.quad(
          oxigraph.namedNode('http://example.com/s'),
          oxigraph.namedNode('http://example.com/p'),
          oxigraph.namedNode('http://example.com/o'),
          oxigraph.defaultGraph(),
        )
        const stream = Readable.from([quad])

        // when
        await clients.stream.store.put(stream, {
          graph: oxigraph.namedNode('http://example.com/g'),
        })

        // then
        const result = store.match(null, null, null, oxigraph.namedNode('http://example.com/g'))
        expect(result).to.have.length(1)
      })

      it('put replaces triples in a graph', async function () {
        // given
        const clients = createOxigraphClients(store)
        const g = oxigraph.namedNode('http://example.com/g')
        store.add(oxigraph.quad(
          oxigraph.namedNode('http://example.com/old'),
          oxigraph.namedNode('http://example.com/p'),
          oxigraph.namedNode('http://example.com/o'),
          g,
        ))
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
        const result = store.match(null, null, null, g)
        expect(result).to.have.length(1)
        expect(result[0].subject.value).to.equal('http://example.com/new')
      })
    })
  })
})
