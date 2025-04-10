import sinon from 'sinon'
import { expect, use } from 'chai'
import type { HandlerArgs } from '@kopflos-cms/core'
import { createEnv } from '@kopflos-cms/core/env.js' // eslint-disable-line import/no-unresolved
import rdf from '@zazuko/env-node'
import type { AnyPointer } from 'clownface'
import snapshots from 'mocha-chai-rdf/snapshots.js'
import bindTemplate from '../index.js'

describe('@kopflos-labs/html-template', function () {
  use(snapshots)

  it('uses core representation a default template data', async function () {
    // given
    const templateFunc = sinon.stub()
    const context = {
      subject: rdf.clownface()
        .namedNode('')
        .addOut(rdf.ns.rdf.type, rdf.namedNode('http://example.com/Foo')),
      env: createEnv({
        baseIri: 'http://example.com/',
        sparql: {
          default: 'http://example.com/query',
        },
      }),
    } as HandlerArgs
    const previousResponse = {
      status: 200,
      body: '<html><body><template target-class="Foo"></template></body></html>',
      headers: {
        'Content-Type': 'text/html',
      },
    }

    // when
    const handler = bindTemplate(templateFunc)
    await handler(context, previousResponse)

    // then
    const templateData: AnyPointer = templateFunc.firstCall.args[1].pointer
    expect(templateData.dataset).canonical.toMatchSnapshot()
  })

  it('fetches data with given arguments', async function () {
    // given
    const templateFunc = sinon.stub()
    const fetchData = sinon.stub().returns(({ env }: HandlerArgs) => {
      return env.clownface()
        .blankNode()
        .addOut(rdf.ns.rdf.type, env.namedNode('http://example.com/Foo'))
        .dataset
    })
    const context = {
      subject: rdf.clownface().namedNode(''),
      env: createEnv({
        baseIri: 'http://example.com/',
        sparql: {
          default: 'http://example.com/query',
        },
      }),
    } as HandlerArgs
    const previousResponse = {
      status: 200,
      body: '<html><body><template target-class="Foo"></template></body></html>',
      headers: {
        'Content-Type': 'text/html',
      },
    }

    // when
    const handler = bindTemplate(templateFunc, fetchData, 'arg1', 'arg2')
    await handler(context, previousResponse)

    // then
    expect(fetchData).to.have.been.calledWith('arg1', 'arg2')
    const templateData: AnyPointer = templateFunc.firstCall.args[1].pointer
    expect(templateData.dataset).canonical.toMatchSnapshot()
  })

  it('fetches data as stream', async function () {
    // given
    const templateFunc = sinon.stub()
    const fetchData = sinon.stub().returns(({ env }: HandlerArgs) => {
      return env.clownface()
        .blankNode()
        .addOut(rdf.ns.rdf.type, env.namedNode('http://example.com/Foo'))
        .dataset.toStream()
    })
    const context = {
      subject: rdf.clownface().namedNode(''),
      env: createEnv({
        baseIri: 'http://example.com/',
        sparql: {
          default: 'http://example.com/query',
        },
      }),
    } as HandlerArgs
    const previousResponse = {
      status: 200,
      body: '<html><body><template target-class="Foo"></template></body></html>',
      headers: {
        'Content-Type': 'text/html',
      },
    }

    // when
    const handler = bindTemplate(templateFunc, fetchData, 'arg1', 'arg2')
    await handler(context, previousResponse)

    // then
    const templateData: AnyPointer = templateFunc.firstCall.args[1].pointer
    expect(templateData.dataset).canonical.toMatchSnapshot()
  })

  it('returns error if previous response is not a string', async function () {
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

  it('returns error if there is no previous response', async function () {
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
