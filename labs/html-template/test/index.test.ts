import sinon from 'sinon'
import { expect } from 'chai'
import type { HandlerArgs } from '@kopflos-cms/core'
import { createEnv } from '@kopflos-cms/core/env.js' // eslint-disable-line import/no-unresolved
import rdf from '@zazuko/env-node'
import bindTemplate from '../index.js'

describe('@kopflos-labs/html-template', () => {
  it('fetches data with given arguments', async () => {
    // given
    const templateFunc = sinon.stub()
    const fetchData = sinon.stub().returns(({ env }: HandlerArgs) => {
      return env.dataset()
    })
    const context = {
      env: createEnv({
        baseIri: 'http://example.com/',
        sparql: {
          default: 'http://example.com/query',
        },
      }),
    } as HandlerArgs
    const previousResponse = {
      status: 200,
      body: '<html></html>',
      headers: {
        'Content-Type': 'text/html',
      },
    }

    // when
    const handler = bindTemplate(templateFunc, fetchData, 'arg1', 'arg2')
    await handler(context, previousResponse)

    // then
    expect(fetchData).to.have.been.calledWith('arg1', 'arg2')
  })

  it('returns error if previous response is not a string', async () => {
    // given
    const context = {
      env: createEnv({
        baseIri: 'http://example.com/',
        sparql: {
          default: 'http://example.com/query',
        },
      }),
    } as HandlerArgs
    const previousResponse = {
      status: 200,
      body: rdf.dataset(),
    }

    // when
    const handler = bindTemplate(sinon.stub())
    const result = await handler(context, previousResponse)

    // then
    expect(result).to.be.an('error')
  })

  it('returns error if there is no previous response', async () => {
    // given
    const context = {
      env: createEnv({
        baseIri: 'http://example.com/',
        sparql: {
          default: 'http://example.com/query',
        },
      }),
    } as HandlerArgs

    // when
    const handler = bindTemplate(sinon.stub())
    const result = await handler(context)

    // then
    expect(result).to.be.an('error')
  })
})
