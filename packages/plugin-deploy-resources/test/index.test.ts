import url from 'node:url'
import { createEmpty } from 'mocha-chai-rdf/store.js'
import rdf from '@zazuko/env-node'
import { expect, use } from 'chai'
import snapshots from 'mocha-chai-rdf/snapshots.js'
import Kopflos from '@kopflos-cms/core'
import configure from '../index.js'
import inMemoryClients from '../../testing-helpers/in-memory-clients.js'

const baseIri = 'http://example.org'
const ex = rdf.namespace(baseIri + '/')

describe('@kopflos-cms/plugin-deploy-resources', () => {
  use(snapshots)

  let env: Kopflos

  beforeEach(createEmpty)

  beforeEach(function () {
    env = new Kopflos({
      baseIri,
      sparql: {
        default: inMemoryClients(this.rdf),
      },
    })
  })

  describe('onStart', () => {
    context('disabled', () => {
      beforeEach(async () => {
        const plugin = configure({
          enabled: false,
        })

        // when
        await plugin.onStart(env)
      })

      it('does nothing', function () {
        expect(this.rdf.dataset.match(null, null, null, ex())).to.have.property('size', 0)
      })
    })

    context('no paths', () => {
      beforeEach(async () => {
        const plugin = configure({
          paths: [],
        })

        // when
        await plugin.onStart(env)
      })

      it('does nothing', function () {
        expect(this.rdf.dataset.match(null, null, null, ex())).to.have.property('size', 0)
      })
    })

    context('path does not exist', () => {
      beforeEach(async () => {
        const plugin = configure({
          paths: ['foobar'],
        })

        // when
        await plugin.onStart(env)
      })

      it('does nothing', function () {
        expect(this.rdf.dataset.match(null, null, null, ex())).to.have.property('size', 0)
      })
    })

    context('enabled', () => {
      beforeEach(async () => {
        const plugin = configure({
          paths: [url.fileURLToPath(new URL('resources', import.meta.url))],
        })

        // when
        await plugin.onStart(env)
      })

      it('deploys trig', async function () {
        const fooGraph = this.rdf.dataset.match(null, null, null, ex('foo'))

        expect(rdf.dataset.toCanonical(fooGraph)).to.matchSnapshot()
      })

      it('applies base', async function () {
        const barGraph = this.rdf.dataset.match(null, null, null, ex('bar'))

        expect(rdf.dataset.toCanonical(barGraph)).to.matchSnapshot()
      })
    })
  })
})
