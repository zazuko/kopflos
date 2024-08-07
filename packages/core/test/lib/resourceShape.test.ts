import * as fs from 'node:fs'
import rdf from '@zazuko/env-node'
import { expect } from 'chai'
import * as Oxigraph from 'oxigraph'
import type { BlankNode, DefaultGraph, NamedNode } from '@rdfjs/types'
import defaultResourceShapeLookup from '../../lib/resourceShape.js'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import inMemoryClients from '../support/in-memory-clients.js'
import { ex } from '../support/ns.js'

describe('lib/resourceShape', () => {
  let db: Oxigraph.Store
  let options: KopflosConfig

  type Format = 'ttl'
  interface Options {
    format?: Format
    base_iri?: string | NamedNode
    to_named_graph?: NamedNode | BlankNode | DefaultGraph
    unchecked?: boolean
    no_transaction?: boolean
  }

  function loadData(path: string, { format = 'ttl', ...options }: Options = {}) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    db.load(fs.readFileSync(path).toString(), {
      format,
      base_iri: 'http://example.com/',
      ...options,
    })
  }

  beforeEach(async () => {
    db = new Oxigraph.Store()
    loadData('test/assets/api.ttl')
    options = {
      sparql: {
        default: inMemoryClients(db),
      },
    }
  })

  describe('default resource shape lookup', () => {
    it('finds directly matching resource', async () => {
      // given
      loadData('test/assets/resources-default-graph.ttl')
      const graph = rdf.clownface({
        dataset: await rdf.dataset().import(rdf.fromFile('test/assets/api.ttl')),
      })
      const kopflos = new Kopflos(graph, options)

      // when
      const results = await defaultResourceShapeLookup(ex.bar, kopflos)

      // then
      expect(results[0]).to.deep.contain({
        api: ex.api1,
        resourceShape: ex.barShape,
      })
      expect(results).to.have.length(1)
    })

    it('finds matching resource by type', async () => {
      // given
      loadData('test/assets/resources-default-graph.ttl')
      const graph = rdf.clownface({
        dataset: await rdf.dataset().import(rdf.fromFile('test/assets/api.ttl')),
      })
      const kopflos = new Kopflos(graph, options)

      // when
      const results = await defaultResourceShapeLookup(ex.foo, kopflos)

      // then
      expect(results[0]).to.deep.contain({
        api: ex.api1,
        resourceShape: ex.FooShape,
        type: ex.Foo,
      })
      expect(results).to.have.length(1)
    })

    it('finds matching resource by property usage', async () => {
      // given
      loadData('test/assets/resources-default-graph.ttl')
      const graph = rdf.clownface({
        dataset: await rdf.dataset().import(rdf.fromFile('test/assets/api.ttl')),
      })
      const kopflos = new Kopflos(graph, options)

      // when
      const results = await defaultResourceShapeLookup(ex['foo/location'], kopflos)

      // then
      expect(results[0]).to.deep.contain({
        api: ex.api1,
        resourceShape: ex.FooShape,
        type: ex.Foo,
        parent: ex.foo,
        property: rdf.ns.schema.location,
      })
      expect(results).to.have.length(1)
    })
  })
})
