import { Readable } from 'node:stream'
import { expect } from 'chai'
import type { HandlerArgs, SubjectHandler } from '@kopflos-cms/core'
import { createEnv } from '@kopflos-cms/core/env.js' // eslint-disable-line import/no-unresolved
import Kopflos from '@kopflos-cms/core'
import { transform } from '../template.js'

describe('@kopflos-cms/vite/template.js', function () {
  let handler: SubjectHandler

  before(function () {
    const kopflos = new Kopflos({
      baseIri: 'http://example.com/',
      sparql: {
        default: 'http://example.com/sparql',
      },
      plugins: {
        '@kopflos-cms/vite': {
        },
      },
    })
    handler = transform.bind(kopflos)()
  })

  describe('transform', function () {
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
  })
})
