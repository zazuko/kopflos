import url from 'node:url'
import * as fs from 'node:fs/promises'
import { promisify } from 'node:util'
import * as path from 'node:path'
import { createEmpty } from 'mocha-chai-rdf/store.js'
import rdf from '@zazuko/env-node'
import { expect, use } from 'chai'
import snapshots from 'mocha-chai-rdf/snapshots.js'
import type { KopflosPlugin } from '@kopflos-cms/core'
import Kopflos from '@kopflos-cms/core'
import { temporaryDirectory } from 'tempy'
import Plugin from '../index.js'
import inMemoryClients from '../../testing-helpers/in-memory-clients.js'

const baseIri = 'http://example.org'
const ex = rdf.namespace(baseIri + '/')

describe('@kopflos-cms/plugin-deploy-resources', function () {
  use(snapshots)

  let env: Kopflos

  beforeEach(createEmpty)

  describe('onStart', function () {
    beforeEach(function () {
      env = new Kopflos({
        basePath: import.meta.dirname,
        baseIri,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
      })
    })

    context('disabled', function () {
      beforeEach(async function () {
        // when
        await new Plugin({
          enabled: false,
        }).onStart(env)
      })

      it('does nothing', function () {
        expect(this.rdf.dataset.match(null, null, null, ex())).to.have.property('size', 0)
      })
    })

    context('no paths', function () {
      beforeEach(async function () {
        // when
        await new Plugin({
          paths: [],
        }).onStart(env)
      })

      it('does nothing', function () {
        expect(this.rdf.dataset.match(null, null, null, ex())).to.have.property('size', 0)
      })
    })

    context('path does not exist', function () {
      beforeEach(async function () {
        // when
        await new Plugin({
          paths: ['foobar'],
        }).onStart(env)
      })

      it('does nothing', function () {
        expect(this.rdf.dataset.match(null, null, null, ex())).to.have.property('size', 0)
      })
    })

    context('enabled', function () {
      beforeEach(async function () {
        // when
        await new Plugin({
          paths: [url.fileURLToPath(new URL('resources', import.meta.url))],
        }).onStart(env)
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

  context('watch', function () {
    let plugin: KopflosPlugin
    let tempDir: string

    beforeEach(async function () {
      env = new Kopflos({
        basePath: import.meta.dirname,
        baseIri,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
        watch: [],
      })

      tempDir = temporaryDirectory()
      await fs.cp(url.fileURLToPath(new URL('resources', import.meta.url)), tempDir, { recursive: true })
    })

    afterEach(async function () {
      await plugin?.onStop?.(env)
      await fs.rm(tempDir, { recursive: true, force: true })
    })

    context('enabled', function () {
      beforeEach(async function () {
        plugin = new Plugin({
          paths: [tempDir],
        })
        await plugin.onStart?.(env)
      })

      it('redeploys when file changes', async function () {
        const fileToModify = path.resolve(tempDir, 'bar.ttl')

        // when
        await fs.appendFile(fileToModify, '<> a ex:Baz .')
        await promisify(setTimeout)(1000)

        // then
        const barGraph = this.rdf.dataset.match(null, null, null, ex('bar'))
        expect(rdf.dataset.toCanonical(barGraph)).toMatchSnapshot()
      })

      it('redeploys when file is created', async function () {
        // given
        const fileToCreate = path.resolve(tempDir, 'baz.ttl')

        // when
        await fs.writeFile(fileToCreate, 'PREFIX ex: <http://example.org/>\n<> a ex:Baz .')
        await promisify(setTimeout)(1000)

        // then
        const bazGraph = this.rdf.dataset.match(null, null, null, ex('baz'))
        expect(rdf.dataset.toCanonical(bazGraph)).toMatchSnapshot()
      })
    })

    context('disabled', function () {
      beforeEach(async function () {
        plugin = new Plugin({
          paths: [tempDir],
          watch: false,
        })
        await plugin.onStart?.(env)
      })

      it('does not react to any changes', async function () {
        // given
        const fileToModify = path.resolve(tempDir, 'bar.ttl')
        const fileToCreate = path.resolve(tempDir, 'baz.ttl')
        const fileToDelete = path.resolve(tempDir, 'index.trig')

        await plugin.onStart?.(env)

        // when
        await Promise.all([
          fs.appendFile(fileToModify, '<> a ex:Baz .'),
          fs.writeFile(fileToCreate, 'PREFIX ex: <http://example.org/>\n<> a ex:Baz .'),
          fs.unlink(fileToDelete),
        ])
        await promisify(setTimeout)(1000)

        // then
        expect(rdf.dataset.toCanonical(this.rdf.dataset)).toMatchSnapshot()
      })
    })
  })
})
