import { Readable } from 'node:stream'
import { expect } from 'chai'
import type { HandlerArgs } from '@kopflos-cms/core'
import { createEnv } from '@kopflos-cms/core/env.js' // eslint-disable-line import/no-unresolved
import { transform } from '../template.js'

const handler = transform()

describe('@kopflos-cms/vite/template.js', () => {
  describe('transform', () => {
    it('throws an error if there is no previous response', async () => {
      const context = {} as HandlerArgs

      await expect(handler(context)).to.be.eventually.rejected
    })

    it('throws an error if the response is not HTML', async () => {
      const context = {} as HandlerArgs
      const response = { headers: { 'content-type': 'application/json' } }

      await expect(handler(context, response)).to.be.eventually.rejected
    })

    it('throws an error if the response is not a string', async () => {
      const context = {} as HandlerArgs
      const response = { headers: { 'content-type': 'text/html' }, body: Readable.from('') }

      await expect(handler(context, response)).to.be.eventually.rejected
    })

    it('does nothing if running in production mode', async () => {
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
