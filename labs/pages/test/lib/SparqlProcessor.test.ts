import { expect, use } from 'chai'
import env from '@zazuko/env-node'
import type { ServicePattern, GroupPattern, Pattern, ValuesPattern } from 'sparqljs'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { Generator, Parser, Wildcard } from 'sparqljs'
import SparqlProcessor from '../../lib/SparqlProcessor.js'
import type { Bindings } from '../../queries/page-patterns.rq'

use(jestSnapshotPlugin())

describe('@kopflos-labs/pages/lib/SparqlProcessor', function () {
  const pages: Bindings[] = [
    {
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<id>.+)'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    },
  ]

  it('rewrites compiled SERVICE triples whose terms have no equals method', function () {
    const processor = new SparqlProcessor(env, pages)
    const query = new Parser().parse(`
      CONSTRUCT { ?resource <http://schema.org/mainEntityOfPage> ?page }
      WHERE {
        SERVICE <https://kopflos.described.at/Pages> {
          ?resource <http://schema.org/mainEntityOfPage> ?page
        }
      }
    `)
    const compiled = JSON.parse(JSON.stringify(query))
    const service: ServicePattern = compiled.where[0]

    const result = processor.processService(service) as Pattern[]
    const values = result.find((p): p is ValuesPattern => p.type === 'values')
    expect(values?.values).to.have.length(1)
    expect(values?.values[0]['?pagePattern_resource']).to.equal(pages[0].pagePattern)
  })

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

  it('should return empty group when resource variable is not found', function () {
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
    const result = processor.processService(service)

    // then
    expect(result).to.be.empty
  })

  it('should return empty group when service pattern has no BGP', function () {
    // given
    const processor = new SparqlProcessor(env, pages)
    const service: ServicePattern = {
      type: 'service',
      name: env.namedNode('https://kopflos.described.at/Pages'),
      patterns: [],
      silent: false,
    }

    // when
    const result = processor.processService(service)

    // then
    expect(result).to.be.empty
  })

  it('should rewrite SERVICE <https://kopflos.described.at/Pages> with matching property path for schema.about', function () {
    // given
    const multiPages: Bindings[] = [
      {
        pagePattern: env.literal('http://example.org/page/(?<id>.+)'),
        resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
        path: env.ns.schema.mainEntity,
      },
      {
        pagePattern: env.literal('http://example.org/about/(?<prefix>.+)'),
        resourcePattern: env.literal('^http://example.org/vocab/(?<prefix>.+)$'),
        path: env.ns.schema.about,
      },
    ]
    const processor = new SparqlProcessor(env, multiPages)
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
              predicate: env.ns.schema.about,
              object: env.variable('aboutPage'),
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
    expect(query).to.contain('http://example.org/vocab/(?<prefix>.+)')
    expect(query).to.not.contain('http://example.org/resource/(?<id>.+)')
    expect(query).to.contain('AS ?aboutPage')
  })

  it('should match pages with schema:mainEntity when query requests schema:mainEntityOfPage', function () {
    // given
    const mainEntityPages: Bindings[] = [
      {
        pagePattern: env.literal('http://example.org/page/(?<id>.+)'),
        resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
        path: env.ns.schema.mainEntity,
      },
    ]
    const processor = new SparqlProcessor(env, mainEntityPages)
    const service: ServicePattern = {
      type: 'service',
      name: env.namedNode('https://kopflos.described.at/Pages'),
      patterns: [
        {
          type: 'bgp',
          triples: [
            {
              subject: env.variable('resource'),
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
    expect(query).to.contain('http://example.org/resource/(?<id>.+)')
    expect(query).to.contain('http://example.org/page/(?<id>.+)')
  })

  it('should isolate internal pattern variables across multiple triples in SERVICE block', function () {
    // given
    const processor = new SparqlProcessor(env, pages)
    const service: ServicePattern = {
      type: 'service',
      name: env.namedNode('https://kopflos.described.at/Pages'),
      patterns: [
        {
          type: 'bgp',
          triples: [
            {
              subject: env.variable('res1'),
              predicate: env.ns.schema.mainEntityOfPage,
              object: env.variable('page1'),
            },
            {
              subject: env.variable('res2'),
              predicate: env.ns.schema.mainEntityOfPage,
              object: env.variable('page2'),
            },
          ],
        },
      ],
      silent: false,
    }

    // when
    const result = processor.processService(service) as Pattern[]

    // then
    const valuesPatterns = result.filter((p): p is ValuesPattern => p.type === 'values')
    expect(valuesPatterns).to.have.length(2)
    const firstVars = Object.keys(valuesPatterns[0].values[0])
    const secondVars = Object.keys(valuesPatterns[1].values[0])
    expect(firstVars).to.deep.equal(['?resourcePattern_res1', '?pagePattern_res1'])
    expect(secondVars).to.deep.equal(['?resourcePattern_res2', '?pagePattern_res2'])
    expect(firstVars.some(v => secondVars.includes(v))).to.be.false
  })
})
