import { expect } from 'chai'
import env from '@zazuko/env-node'
import { createPageUrl } from '../../lib/pageUrl.js'
import type { Bindings } from '../../queries/page-patterns.rq'

describe('@kopflos-labs/pages/lib/pageUrl', function () {
  const pattern: Bindings = {
    path: env.ns.schema.mainEntity,
    resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    pagePattern: env.literal('^http://example.org/page/(?<id>.+)$'),
  }
  const resource = env.namedNode('http://example.org/resource/123')

  it('requires both IRI arguments', function () {
    const resolve = createPageUrl([pattern], env)
    for (const args of [[], [resource], [resource, env.ns.schema.mainEntity, resource], [env.literal(resource.value), env.ns.schema.mainEntity], [resource, env.literal('about')]]) {
      expect(() => resolve(args)).to.throw('requires two IRI arguments')
    }
  })

  it('rejects missing matches and unrelated relationships', function () {
    const resolve = createPageUrl([pattern], env)
    expect(() => resolve([env.namedNode('http://example.org/other/123'), env.ns.schema.mainEntity])).to.throw('No matching page URL')
    expect(() => resolve([resource, env.ns.schema.about])).to.throw('No matching page URL')
  })

  it('rejects multiple distinct matching URLs', function () {
    const resolve = createPageUrl([pattern, { ...pattern, pagePattern: env.literal('http://example.org/other/(?<id>.+)') }], env)
    expect(() => resolve([resource, env.ns.schema.mainEntity])).to.throw('Ambiguous page URL')
  })

  it('accepts duplicate matching rules producing the same URL', function () {
    const resolve = createPageUrl([pattern, pattern], env)
    expect(resolve([resource, env.ns.schema.mainEntityOfPage]).value).to.equal('http://example.org/page/123')
  })

  it('should transform schema:mainEntityOfPage object when patterns match', function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<id>.+)'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    }]
    const resolve = createPageUrl(patterns, env)
    const input = [
      env.namedNode('http://example.org/resource/123'),
      env.ns.schema.mainEntityOfPage,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('http://example.org/page/123')
    expect(output.termType).to.equal('NamedNode')
  })

  it('should handle multiple named groups in patterns', function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<category>.+)/(?<id>.+)'),
      resourcePattern: env.literal('^http://example.org/resource/(?<category>[^/]+)/(?<id>.+)$'),
    }]
    const resolve = createPageUrl(patterns, env)
    const input = [
      env.namedNode('http://example.org/resource/books/123'),
      env.ns.schema.mainEntityOfPage,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('http://example.org/page/books/123')
  })

  it('should strip trailing $ from pagePattern', function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<id>.+)$'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    }]
    const resolve = createPageUrl(patterns, env)
    const input = [
      env.namedNode('http://example.org/resource/123'),
      env.ns.schema.mainEntityOfPage,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('http://example.org/page/123')
  })

  it('should handle missing groups in pagePattern replacement', function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<id>.+)/(?<missing>.+)'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    }]
    const resolve = createPageUrl(patterns, env)
    const input = [
      env.namedNode('http://example.org/resource/123'),
      env.ns.schema.mainEntityOfPage,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('http://example.org/page/123/')
  })

  it('should transform URL with dictionary reverse-lookup for mapped variables', function () {
    // given
    const patterns: Bindings[] = [{
      pagePattern: env.literal('^https://example.com/(?<prefix>schema|foaf):(?<term>[a-zA-Z0-9_-]+).html$'),
      resourcePattern: env.literal('^(?<prefix>http://schema\\.org/|http://xmlns\\.com/foaf/0\\.1/)(?<term>[a-zA-Z0-9_-]+)$'),
      path: env.ns.schema.mainEntity,
    }]
    const constraints = {
      prefix: {
        schema: 'http://schema.org/',
        foaf: 'http://xmlns.com/foaf/0.1/',
      },
    }
    const resolve = createPageUrl(patterns, env, constraints)
    const input = [
      env.namedNode('http://schema.org/Person'),
      env.ns.schema.mainEntityOfPage,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('https://example.com/schema:Person.html')
    expect(output.termType).to.equal('NamedNode')
  })

  it('should transform custom predicate declared in property shapes', function () {
    // given
    const customPredicate = env.namedNode('http://example.org/customPredicate')
    const patterns: Bindings[] = [{
      pagePattern: env.literal('^https://example.com/about/(?<prefix>schema|foaf).html$'),
      resourcePattern: env.literal('^(?<prefix>http://schema\\.org/|http://xmlns\\.com/foaf/0\\.1/)$'),
      path: customPredicate,
    }]
    const constraints = {
      prefix: {
        schema: 'http://schema.org/',
        foaf: 'http://xmlns.com/foaf/0.1/',
      },
    }
    const resolve = createPageUrl(patterns, env, constraints)
    const input = [
      env.namedNode('http://xmlns.com/foaf/0.1/'),
      customPredicate,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('https://example.com/about/foaf.html')
    expect(output.termType).to.equal('NamedNode')
  })

  it('should reverse-map dictionary constraints for destination page pattern without passing caller page constraints', function () {
    // given
    const patterns: Bindings[] = [{
      pagePattern: env.literal('^https://example.com/(?<prefix>schema|foaf):(?<term>[a-zA-Z0-9_-]+).html$'),
      resourcePattern: env.literal('^(?<prefix>http://schema\\.org/|http://xmlns\\.com/foaf/0\\.1/)(?<term>[a-zA-Z0-9_-]+)$'),
      path: env.ns.schema.mainEntity,
    }]
    // Current page / caller does not pass constraints
    const resolve = createPageUrl(patterns, env)
    const input = [
      env.namedNode('http://schema.org/Person'),
      env.ns.schema.mainEntityOfPage,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('https://example.com/schema:Person.html')
    expect(output.termType).to.equal('NamedNode')
  })

  it('should reverse-map single-entry dictionary constraints with special regex characters without passing caller constraints', function () {
    // given
    const patterns: Bindings[] = [{
      pagePattern: env.literal('^https://example.com/(?<dict>foo\\.bar)/(?<id>[0-9]+).html$'),
      resourcePattern: env.literal('^http://example\\.org/(?<dict>foo\\.bar)/(?<id>[0-9]+)$'),
      path: env.ns.schema.mainEntityOfPage,
    }]
    const resolve = createPageUrl(patterns, env)
    const input = [
      env.namedNode('http://example.org/foo.bar/42'),
      env.ns.schema.mainEntityOfPage,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('https://example.com/foo.bar/42.html')
    expect(output.termType).to.equal('NamedNode')
  })

  it('should support nested groups/parentheses in pagePattern without leaving dangling parentheses', function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('^http://example.org/page/(?<id>(user|admin)_[0-9]+).html$'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>(user|admin)_[0-9]+)$'),
    }]
    const resolve = createPageUrl(patterns, env)
    const input = [
      env.namedNode('http://example.org/resource/user_123'),
      env.ns.schema.mainEntityOfPage,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('http://example.org/page/user_123.html')
    expect(output.termType).to.equal('NamedNode')
  })

  it('should support multiple nested groups and optional parameters in pagePattern', function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('^http://example.org/(?<lang>(en|de))/(?<type>(user|org))/(?<id>[0-9]+)(?<ext>\\.(json|html))?$'),
      resourcePattern: env.literal('^http://example.org/(?<lang>(en|de))/(?<type>(user|org))/(?<id>[0-9]+)$'),
    }]
    const resolve = createPageUrl(patterns, env)
    const input = [
      env.namedNode('http://example.org/en/user/42'),
      env.ns.schema.mainEntityOfPage,
    ]

    // when
    const output = resolve(input)

    // then
    expect(output.value).to.equal('http://example.org/en/user/42')
    expect(output.termType).to.equal('NamedNode')
  })
})
