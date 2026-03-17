import type { parse } from 'node:querystring'
import parent, { Environment } from '@zazuko/env-node'
import type { KopflosConfig } from '@kopflos-cms/core'
import sinon from 'sinon'
import { expect } from 'chai'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { Bindings as PagePatternsRow } from '../../queries/page-patterns.rq'
import { executeQueries } from '../../lib/pageData.js'

type PagePatterns = PagePatternsRow[]

describe('pageData', function () {
  describe('executeQueries', function () {
    it('executes a simple query against default endpoint', async function () {
      // given
      const queries = {
        example: sinon.stub().resolves(parent.dataset().toStream()),
      }
      const env = new Environment([
        TestKopflosFactory,
        mockSparqlFactory(),
      ], { parent })
      const subjectVariables = {}
      const queryParams = {}
      const pagePatterns: PagePatterns = []

      // when
      const data = await executeQueries({
        queries,
        env,
        subjectVariables,
        queryParams,
        pagePatterns,
      })

      // then
      expect(data).to.have.property('example')
      expect(queries.example).to.have.been.calledOnceWith(sinon.match.any, sinon.match({
        client: env.sparql.default.stream,
      }))
    })

    it('executes a query against named endpoint', async function () {
      // given
      const queries = {
        example: {
          query: sinon.stub().resolves(parent.dataset().toStream()),
          endpoint: 'named',
        },
      }
      const env = new Environment([
        TestKopflosFactory,
        mockSparqlFactory('named'),
      ], { parent })
      const subjectVariables = {}
      const queryParams = {}
      const pagePatterns: PagePatterns = []

      // when
      const data = await executeQueries({
        queries,
        env,
        subjectVariables,
        queryParams,
        pagePatterns,
      })

      // then
      expect(data).to.have.property('example')
      expect(queries.example.query).to.have.been.calledWith(sinon.match.any, sinon.match({
        client: env.sparql.named.stream,
      }))
    })

    it('passes array-valued query parameters', async function () {
      // given
      const query = sinon.stub().resolves(parent.dataset().toStream())
      const queries = { example: query }
      const env = new Environment([
        TestKopflosFactory,
        mockSparqlFactory(),
      ], { parent })
      const queryParams = {
        tags: ['foo', 'bar'],
      }

      // when
      await executeQueries({
        queries,
        env,
        subjectVariables: {},
        queryParams,
        pagePatterns: [],
      })

      // then
      const params = query.firstCall.args[0]
      expect(params.get(parent.literal('tags'))).to.deep.eq([
        parent.literal('foo'),
        parent.literal('bar'),
      ])
    })

    it('processes parameters with templates', async function () {
      // given
      const query = sinon.stub().resolves(parent.dataset().toStream())
      const queries = { example: query }
      const env = new Environment([
        TestKopflosFactory,
        mockSparqlFactory(),
      ], { parent })
      const parameters = {
        'schema:about': 'http://example.org/[slug]',
        custom: '[slug]-suffix',
      }
      const subjectVariables = {
        slug: 'my-page',
      }

      // when
      await executeQueries({
        queries,
        env,
        subjectVariables,
        queryParams: {},
        pagePatterns: [],
        parameters,
      })

      // then
      const params = query.firstCall.args[0]
      expect(params.get(env.ns.schema.about)).to.deep.eq(parent.literal('http://example.org/my-page'))
      expect(params.get(parent.literal('custom'))).to.deep.eq(parent.literal('my-page-suffix'))
    })

    it('skips parameters if they are already in params', async function () {
      // given
      const query = sinon.stub().resolves(parent.dataset().toStream())
      const queries = { example: query }
      const env = new Environment([
        TestKopflosFactory,
        mockSparqlFactory(),
      ], { parent })
      const parameters = {
        slug: 'should-be-skipped',
      }
      const subjectVariables = {
        slug: 'my-page',
      }

      // when
      await executeQueries({
        queries,
        env,
        subjectVariables,
        queryParams: {},
        pagePatterns: [],
        parameters,
      })

      // then
      const params = query.firstCall.args[0]
      expect(params.get(parent.literal('slug'))).to.deep.eq(parent.literal('my-page'))
    })

    it('skips empty query parameters', async function () {
      // given
      const query = sinon.stub().resolves(parent.dataset().toStream())
      const queries = { example: query }
      const env = new Environment([
        TestKopflosFactory,
        mockSparqlFactory(),
      ], { parent })
      const queryParams = {
        empty: '',
        nullish: null,
        undefined,
        zero: '0',
      } as unknown as ReturnType<typeof parse>

      // when
      await executeQueries({
        queries,
        env,
        subjectVariables: {},
        queryParams,
        pagePatterns: [],
      })

      // then
      const params = query.firstCall.args[0]
      expect(params.has(parent.literal('empty'))).to.be.false
      expect(params.has(parent.literal('nullish'))).to.be.false
      expect(params.has(parent.literal('undefined'))).to.be.false
      expect(params.get(parent.literal('zero'))).to.deep.eq(parent.literal('0'))
    })

    it('handles mainEntity as IRI template', async function () {
      // given
      const query = sinon.stub().resolves(parent.dataset().toStream())
      const queries = { example: query }
      const env = new Environment([
        TestKopflosFactory,
        mockSparqlFactory(),
      ], { parent })
      const subjectVariables = {
        slug: 'my-page',
      }

      // when
      await executeQueries({
        queries,
        env,
        subjectVariables,
        queryParams: {},
        pagePatterns: [],
        mainEntity: 'http://example.org/[slug]',
      })

      // then
      const params = query.firstCall.args[0]
      expect(params.get(env.ns.schema.mainEntity)).to.deep.eq(parent.namedNode('http://example.org/my-page'))
    })

    it('handles mainEntity as app namespace template', async function () {
      // given
      const query = sinon.stub().resolves(parent.dataset().toStream())
      const queries = { example: query }
      const env = new Environment([
        TestKopflosFactory,
        mockSparqlFactory(),
      ], { parent })
      const subjectVariables = {
        slug: 'my-page',
      }

      // when
      await executeQueries({
        queries,
        env,
        subjectVariables,
        queryParams: {},
        pagePatterns: [],
        mainEntity: '[slug]',
      })

      // then
      const params = query.firstCall.args[0]
      expect(params.get(env.ns.schema.mainEntity)).to.deep.eq(parent.namedNode('http://example.org/app#my-page'))
    })
  })
})

class TestKopflosFactory {
  static exports = ['kopflos']
  get kopflos() {
    return {
      api: parent.namedNode('http://example.org/api'),
      config: {} as KopflosConfig,
      variables: {},
      appNs: parent.namespace('http://example.org/app#'),
    }
  }
}

function mockSparqlFactory(...namedClients: string[]) {
  return class {
    static exports = ['sparql']
    get sparql() {
      return Object.fromEntries(['default', ...namedClients].map(client => [client, {
        stream: { type: `${client} stream` } as unknown as StreamClient,
        parsed: { type: `${client}  parsed` } as unknown as ParsingClient,
      }]))
    }
  }
}
