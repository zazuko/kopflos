import url from 'node:url'
import * as fs from 'node:fs/promises'
import { promisify } from 'node:util'
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

  describe('onStart', () => {
    beforeEach(function () {
      env = new Kopflos({
        baseIri,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
      })
    })

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

        expect(rdf.dataset.toCanonical(fooGraph)).toMatchSnapshot()
      })

      it('applies base', async function () {
        const barGraph = this.rdf.dataset.match(null, null, null, ex('bar'))

        expect(rdf.dataset.toCanonical(barGraph)).toMatchSnapshot()
      })
    })
  })

  context('watch', () => {
    let plugin: ReturnType<typeof configure>

    beforeEach(function () {
      env = new Kopflos({
        baseIri,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
        watch: [],
      })
    })

    context('enabled', () => {
      beforeEach(async () => {
        plugin = configure({
          paths: [url.fileURLToPath(new URL('resources', import.meta.url))],
        })
      })

      it('redeploys when file changes', async function () {
        const fileToModify = url.fileURLToPath(new URL('resources/bar.ttl', import.meta.url))
        const originalContents = await fs.readFile(fileToModify)

        try {
          // given
          await plugin.onStart(env)

          // when
          await fs.appendFile(fileToModify, '<> a ex:Baz .')
          await promisify(setTimeout)(1000)

          // then
          const barGraph = this.rdf.dataset.match(null, null, null, ex('bar'))
          expect(rdf.dataset.toCanonical(barGraph)).toMatchSnapshot()
        } finally {
          await plugin.onStop(env)
          await fs.writeFile(fileToModify, originalContents)
        }
      })

      it('redeploys when file is created', async function () {
        // given
        const fileToCreate = url.fileURLToPath(new URL('resources/baz.ttl', import.meta.url))

        try {
          await plugin.onStart(env)

          // when
          await fs.writeFile(fileToCreate, 'PREFIX ex: <http://example.org/>\n<> a ex:Baz .')
          await promisify(setTimeout)(1000)

          // then
          const bazGraph = this.rdf.dataset.match(null, null, null, ex('baz'))
          expect(rdf.dataset.toCanonical(bazGraph)).toMatchSnapshot()
        } finally {
          await plugin.onStop(env)
          await fs.unlink(fileToCreate)
        }
      })
    })

    context('disabled', () => {
      beforeEach(async () => {
        plugin = configure({
          paths: [url.fileURLToPath(new URL('resources', import.meta.url))],
          watch: false,
        })
      })

      it('does not react to any changes', async function () {
        // given
        const fileToModify = url.fileURLToPath(new URL('resources/bar.ttl', import.meta.url))
        const barContents = await fs.readFile(fileToModify)
        const fileToCreate = url.fileURLToPath(new URL('resources/baz.ttl', import.meta.url))
        const fileToDelete = url.fileURLToPath(new URL('resources/index.trig', import.meta.url))
        const trigContents = await fs.readFile(fileToDelete)

        try {
          await plugin.onStart(env)

          // when
          await Promise.all([
            fs.appendFile(fileToModify, '<> a ex:Baz .'),
            fs.writeFile(fileToCreate, 'PREFIX ex: <http://example.org/>\n<> a ex:Baz .'),
            fs.unlink(fileToDelete),
          ])
          await promisify(setTimeout)(1000)

          // then
          expect(rdf.dataset.toCanonical(this.rdf.dataset)).toMatchSnapshot()
        } finally {
          await fs.unlink(fileToCreate)
          await fs.writeFile(fileToModify, barContents)
          await fs.writeFile(fileToDelete, trigContents)
        }
      })
    })
  })
})
