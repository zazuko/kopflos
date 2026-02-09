import { Readable } from 'node:stream'
import { expect } from 'chai'
import type { HandlerArgs, SubjectHandler } from '@kopflos-cms/core'
import { createEnv } from '@kopflos-cms/core/env.js' // eslint-disable-line import/no-unresolved
import Kopflos from '@kopflos-cms/core'
import rdf from '@zazuko/env-node'
import { transform } from '../template.js'

describe('@kopflos-cms/vite/template.js', function () {
  let handler: SubjectHandler

  class MockPlugin {
    public readonly name = '@kopflos-cms/vite'

    get viteDevServer() {
      return {
        transformIndexHtml() {
          return 'transformed'
        },
      }
    }
  }

  describe('transform', function () {
    describe('when vite plugin is missing', function () {
      before(function () {
        const kopflos = new Kopflos({
          baseIri: 'http://example.com/',
          sparql: {
            default: 'http://example.com/sparql',
          },
        })
        handler = transform.bind(kopflos)()
      })

      it('throws an error', async function () {
        const context = {
          env: createEnv({
            baseIri: 'http://example.com/',
            sparql: {
              default: 'http://example.com/sparql',
            },
          }),
        } as HandlerArgs
        const response = { headers: { 'content-type': 'text/html' }, body: '' }

        await expect(handler(context, response)).to.eventually.equal(response)
      })
    })

    before(function () {
      const kopflos = new Kopflos({
        baseIri: 'http://example.com/',
        sparql: {
          default: 'http://example.com/sparql',
        },
        plugins: [new MockPlugin()],
      })
      handler = transform.bind(kopflos)()
    })

    it('throws an error if there is no previous response', async function () {
      const context = {} as HandlerArgs

      await expect(handler(context)).to.be.eventually.rejected
    })

    it('throws an error if the response is not HTML', async function () {
      const context = {} as HandlerArgs
      const response = { headers: { 'content-type': 'application/json' } }

      await expect(handler(context, response)).to.be.eventually.rejected
    })

    it('throws an error if the response is not a string', async function () {
      const context = {} as HandlerArgs
      const response = { headers: { 'content-type': 'text/html' }, body: Readable.from('') }

      await expect(handler(context, response)).to.be.eventually.rejected
    })

    it('does nothing if running in production mode', async function () {
      const context = {
        env: createEnv({
          baseIri: 'http://example.com/',
          sparql: {
            default: 'http://example.com/sparql',
          },
          mode: 'production',
        }),
      } as HandlerArgs
      const response = { headers: { 'content-type': 'text/html' }, body: '' }

      await expect(handler(context, response)).to.eventually.equal(response)
    })

    it('calls transform on the vite dev server', async function () {
      const context = {
        env: createEnv({
          baseIri: 'http://example.com/',
          sparql: {
            default: 'http://example.com/sparql',
          },
        }),
        subject: rdf.clownface({ value: 'http://example.com/page' }),
      } as unknown as HandlerArgs
      const response = { headers: { 'content-type': 'text/html' }, body: '' }

      await expect(handler(context, response)).to.eventually.have.property('body', 'transformed')
    })
  })
})
