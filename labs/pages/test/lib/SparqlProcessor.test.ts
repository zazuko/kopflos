import { expect, use } from 'chai'
import env from '@zazuko/env-node'
import type { ServicePattern, GroupPattern } from 'sparqljs'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { Generator, Wildcard } from 'sparqljs'
import SparqlProcessor from '../../lib/SparqlProcessor.js'
import type { Bindings } from '../../queries/page-patterns.rq'

use(jestSnapshotPlugin())

describe('@kopflos-labs/pages/lib/SparqlProcessor', function () {
  const pages: Bindings[] = [
    {
      pagePattern: env.literal('http://example.org/page/(?<id>.+)'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    },
  ]

  it('should ignore SERVICE clauses with other names', function () {
    // given
    const processor = new SparqlProcessor(env, pages)
    const service: ServicePattern = {
      type: 'service',
      name: env.namedNode('http://example.org/other-service'),
      patterns: [],
      silent: false,
    }

    // when
    const result = processor.processService(service)

    // then
    expect(result).to.deep.equal(service)
  })

  it('should rewrite SERVICE <https://kopflos.described.at/Pages>', function () {
    // given
    const processor = new SparqlProcessor(env, pages)
    const resourceVar = env.variable('resource')
    const service: ServicePattern = {
      type: 'service',
      name: env.namedNode('https://kopflos.described.at/Pages'),
      patterns: [
        {
          type: 'bgp',
          triples: [
            {
              subject: resourceVar,
              predicate: env.ns.schema.mainEntityOfPage,
              object: env.variable('page'),
            },
          ],
        },
      ],
      silent: false,
    }

    // when
    const result = processor.processService(service) as GroupPattern

    // then
    const query = new Generator().stringify({
      type: 'query',
      queryType: 'SELECT',
      variables: [new Wildcard()],
      where: [result],
      prefixes: {},
    })
    expect(query).toMatchSnapshot()
  })

  it('should throw when resource variable is not found', function () {
    // given
    const processor = new SparqlProcessor(env, pages)
    const service: ServicePattern = {
      type: 'service',
      name: env.namedNode('https://kopflos.described.at/Pages'),
      patterns: [
        {
          type: 'bgp',
          triples: [],
        },
      ],
      silent: false,
    }

    // when
    expect(() => processor.processService(service)).to.throw('No mainEntity variable found in service pattern')
  })

  it('should throw when service pattern has no BGP', function () {
    // given
    const processor = new SparqlProcessor(env, pages)
    const service: ServicePattern = {
      type: 'service',
      name: env.namedNode('https://kopflos.described.at/Pages'),
      patterns: [],
      silent: false,
    }

    // when
    expect(() => processor.processService(service)).to.throw('No mainEntity variable found in service pattern')
  })
})
