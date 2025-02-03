import url from 'node:url'
import { createStore } from 'mocha-chai-rdf/store.js'
import { expect } from 'chai'
import type { DatasetCore } from '@rdfjs/types'
import rdf from '@zazuko/env-node'
import { loadDecorators } from '../../lib/decorators.js'
import type { HandlerArgs } from '../../lib/handler.js'
import { createEnv } from '../../lib/env/index.js'
import type { Kopflos, KopflosConfig } from '../../lib/Kopflos.js'
import { ex } from '../../../testing-helpers/ns.js'
import { kl } from '../../ns.js'
import { bar, foo, personOnly } from '../support/decorators.js'

describe('@kopflos-cms/core/lib/decorators.js', () => {
  let kopflos: Pick<Kopflos<DatasetCore>, 'env' | 'apis'>
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
    const apis = this.rdf.graph.has(rdf.ns.rdf.type, kl.Api)
    kopflos = {
      env: createEnv(config),
      apis,
    }
  })

  describe('loadDecorators', () => {
    context('decorators without implementation', () => {
      it('are skipped', async function () {
        // given
        const args = <HandlerArgs>{
          resourceShape: this.rdf.graph.namedNode(ex.resourceShape),
        }

        // when
        const decorators = await loadDecorators(kopflos, args)

        // then
        expect(decorators).to.be.empty
      })
    })

    context('decorators with implementations', () => {
      it('are loaded', async function () {
        // given
        const args = <HandlerArgs>{
          resourceShape: this.rdf.graph.namedNode(ex.resourceShape),
        }

        // when
        const decorators = await loadDecorators(kopflos, args)

        // then
        expect(decorators).to.contain.all.members([foo, bar])
      })
    })

    context('decorators with limitations', () => {
      it('loads only those passing the check', async function () {
        // given
        const args = <HandlerArgs>{
          resourceShape: this.rdf.graph.namedNode(ex.resourceShape),
        }

        // when
        const decorators = await loadDecorators(kopflos, args)

        // then
        expect(decorators).to.deep.eq([personOnly])
      })
    })
  })
})
