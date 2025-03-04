import url from 'node:url'
import { createStore } from 'mocha-chai-rdf/store.js'
import { expect } from 'chai'
import { loadDecorators } from '../../lib/decorators.js'
import type { KopflosEnvironment } from '../../lib/env/index.js'
import { createEnv } from '../../lib/env/index.js'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import { ex } from '../../../testing-helpers/ns.js'
import { bar, foo } from '../support/decorators.js'

describe('@kopflos-cms/core/lib/decorators.js', () => {
  let env: KopflosEnvironment
  const config: KopflosConfig = {
    baseIri: 'http://localhost:1429/',
    sparql: {
      default: {
        endpointUrl: 'http://localhost:7878/query?union-default-graph',
        updateUrl: 'http://localhost:7878/update',
      },
    },
    codeBase: url.fileURLToPath(import.meta.url),
  }

  beforeEach(createStore(import.meta.url, {
    format: 'trig',
  }))

  beforeEach(function () {
    env = createEnv(config)
  })

  describe('loadDecorators', () => {
    context('decorators without implementation', () => {
      it('are skipped', async function () {
        // given
        const api = this.rdf.graph.namedNode(ex.api)

        // when
        const decorators = await loadDecorators({ env, api })

        // then
        expect(decorators).to.be.empty
      })
    })

    context('decorators with implementations', () => {
      it('are loaded', async function () {
        // given
        const api = this.rdf.graph.namedNode(ex.api)

        // when
        const decorators = await loadDecorators({ env, api })

        // then
        expect(decorators).to.contain.all.members([foo, bar])
      })
    })
  })
})
