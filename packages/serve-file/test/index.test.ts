/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReadableStream } from 'node:stream/web'
import { Readable } from 'node:stream'
import { expect } from 'chai'
import type { ResultEnvelope } from '@kopflos-cms/core'
import getStream from 'get-stream'
import factory from '../index.js'

describe('@kopflos-cms/serve-file', function () {
  it('serves from path', async function () {
    // given
    const serveFile = factory('test/test.txt')

    // when
    const response = await serveFile({} as any)

    // then
    expect(response).to.deep.equal({
      status: 200,
      body: 'Hello World\n',
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  })

  it('detects media type', async function () {
    // given
    const serveFile = factory('test/test.json')

    // when
    const response = await serveFile({} as any)

    // then
    expect(response).to.deep.contain({
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('falls back to application/octet-stream', async function () {
    // given
    const serveFile = factory('test/foo.bar')

    // when
    const response = await serveFile({} as any)

    // then
    expect(response).to.deep.contain({
      body: 'baz\n',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })
  })

  it('allows media type override', async function () {
    // given
    const serveFile = factory({
      path: 'test/test.json',
      contentType: 'application/ld+json',
    })

    // when
    const response = await serveFile({} as any)

    // then
    expect(response).to.deep.contain({
      headers: {
        'Content-Type': 'application/ld+json',
      },
    })
  })

  it('serves stream', async function () {
    // given
    const serveFile = factory({
      path: 'test/test.txt',
      stream: true,
    })

    // when
    const response = await serveFile({} as any) as ResultEnvelope

    // then
    expect(response).to.deep.contain({
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
    expect(response.body).to.be.instanceOf(ReadableStream)
    await expect(getStream(Readable.fromWeb(response.body as any))).to.eventually.equal('Hello World\n')
  })
})
