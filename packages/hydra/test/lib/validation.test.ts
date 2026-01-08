import { expect } from 'chai'
import type { HandlerArgs, KopflosEnvironment } from '@kopflos-cms/core'
// eslint-disable-next-line import/no-unresolved
import { createEnv } from '@kopflos-cms/core/env.js'
import { createStore } from 'mocha-chai-rdf/store.js'
import { shapesGraphLoader } from '../../lib/validation.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'
import { ex } from '../../../testing-helpers/ns.js'

describe('@kopflos-cms/hydra/lib/validation.js', function () {
  let env: KopflosEnvironment

  beforeEach(createStore(import.meta.url, {
    format: 'trig',
  }))

  beforeEach(function () {
    env = createEnv({
      baseIri: 'http://example.org/',
      sparql: {
        default: inMemoryClients(this.rdf),
      },
    })
  })

  describe('shapesGraphLoader', function () {
    context('collection has hydra#memberCreateShape', function () {
      it('copies it to output shapes', async function () {
        // given
        const args = <HandlerArgs>{
          env,
          subject: this.rdf.graph.node(ex.collection),
        }

        // when
        const shapesGraph = await shapesGraphLoader(args)

        // then
        expect(shapesGraph).canonical.toMatchSnapshot()
      })
    })
    context('collection has hydra#createMemberCreateShape', function () {
      it('copies it to output shapes', async function () {
        // given
        const args = <HandlerArgs>{
          env,
          subject: this.rdf.graph.node(ex.collection),
        }

        // when
        const shapesGraph = await shapesGraphLoader(args)

        // then
        expect(shapesGraph).canonical.toMatchSnapshot()
      })
    })

    context('when collection has sh:shapesGraph', function () {
      it('includes referenced sh:shapesGraph', async function () {
        // given
        const args = <HandlerArgs>{
          env,
          subject: this.rdf.graph.node(ex.collection),
        }

        // when
        const shapesGraph = await shapesGraphLoader(args)

        // then
        const imports = [...shapesGraph.match(null, env.ns.owl.imports)]
        expect(imports.map((m) => m.object)).to.deep.contain.all.members([
          ex.fooShapes,
          ex.barShapes,
        ])
      })
    })
  })
})
