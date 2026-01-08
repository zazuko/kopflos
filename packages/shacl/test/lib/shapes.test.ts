import { expect } from 'chai'
import type { HandlerArgs, KopflosEnvironment } from '@kopflos-cms/core'
// eslint-disable-next-line import/no-unresolved
import { createEnv } from '@kopflos-cms/core/env.js'
import { createStore } from 'mocha-chai-rdf/store.js'
import { loadShapesGraph } from '../../lib/shapes.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'
import { ex } from '../../../testing-helpers/ns.js'

describe('@kopflos-cms/shacl/lib/shapes.js', function () {
  let env: KopflosEnvironment

  beforeEach(createStore(import.meta.url, { format: 'trig', loadAll: true }))

  beforeEach(function () {
    env = createEnv({
      baseIri: 'http://example.com/',
      sparql: {
        default: inMemoryClients(this.rdf),
      },
    })
  })

  describe('loadShapesGraph', function () {
    it('loads IRI references from the store', async function () {
      // given
      const args = <HandlerArgs>{
        env,
        handler: this.rdf.graph.node(ex.ImportsWithUri),
      }

      // when
      const dataset = await loadShapesGraph(args)

      // then
      const graph = env.clownface({ dataset })
      expect(graph.has(env.ns.rdf.type, env.ns.sh.NodeShape).term).to.eq(ex.shape)
    })

    it('loads with referenced code', async function () {
      // given
      const args = <HandlerArgs>{
        env,
        handler: this.rdf.graph.node(ex.ImportsWithCode),
      }

      // when
      const dataset = await loadShapesGraph(args)

      // then
      const graph = env.clownface({ dataset })
      expect(graph.has(env.ns.rdf.type, env.ns.sh.NodeShape).term).to.eq(ex.generatedShape)
    })

    it('loads with referenced code and arguments', async function () {
      // given
      const args = <HandlerArgs>{
        env,
        handler: this.rdf.graph.node(ex.ImportsWithArgs),
      }

      // when
      const dataset = await loadShapesGraph(args)

      // then
      const graph = env.clownface({ dataset })
      expect(graph.has(env.ns.rdf.type, env.ns.sh.NodeShape).term).to.eq(ex.generatedShape)
    })

    ;['IncompleteCodeImport', 'BadCodeImport', 'MissingImplementation', 'ImportedCodeThrows'].forEach(term => {
      it(`throws when import is broken (${term})`, async function () {
        // given
        const args = <HandlerArgs>{
          env,
          handler: this.rdf.graph.node(ex(term)),
        }

        // then
        await expect(loadShapesGraph(args)).to.have.rejected
      })
    })
  })
})
