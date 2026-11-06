import { Readable } from 'node:stream'
import { expect } from 'chai'
import env from '@zazuko/env-node'
import type { Quad } from '@rdfjs/types'
import PageUrlTransform from '../../lib/PageUrlTransform.js'
import type { Bindings } from '../../queries/page-patterns.rq'

describe('@kopflos-labs/pages/lib/PageUrlTransform', function () {
  it('should pass through quads with other predicates', async function () {
    // given
    const patterns: Bindings[] = []
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(env.namedNode('http://example.org/resource'), env.ns.schema.name, env.literal('Resource')),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].predicate.value).to.equal(env.ns.schema.name.value)
  })

  it('should transform schema:mainEntityOfPage object when patterns match', async function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<id>.+)'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    }]
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(
        env.namedNode('http://example.org/resource/123'),
        env.ns.schema.mainEntityOfPage,
        env.literal('http://example.org/page/(?<id>.+)'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('http://example.org/page/123')
    expect(output[0].object.termType).to.equal('NamedNode')
  })

  it('should pass through schema:mainEntityOfPage quad if no pattern matches', async function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<id>.+)'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    }]
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(
        env.namedNode('http://example.org/other/123'),
        env.ns.schema.mainEntityOfPage,
        env.literal('http://example.org/page/other'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('http://example.org/page/other')
    expect(output[0].object.termType).to.equal('Literal')
  })

  it('should handle multiple named groups in patterns', async function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<category>.+)/(?<id>.+)'),
      resourcePattern: env.literal('^http://example.org/resource/(?<category>[^/]+)/(?<id>.+)$'),
    }]
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(
        env.namedNode('http://example.org/resource/books/123'),
        env.ns.schema.mainEntityOfPage,
        env.literal('http://example.org/page/(?<category>.+)/(?<id>.+)'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('http://example.org/page/books/123')
  })

  it('should strip trailing $ from pagePattern', async function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<id>.+)$'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    }]
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(
        env.namedNode('http://example.org/resource/123'),
        env.ns.schema.mainEntityOfPage,
        env.literal('http://example.org/page/(?<id>.+)$'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('http://example.org/page/123')
  })

  it('should handle missing groups in pagePattern replacement', async function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('http://example.org/page/(?<id>.+)/(?<missing>.+)'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
    }]
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(
        env.namedNode('http://example.org/resource/123'),
        env.ns.schema.mainEntityOfPage,
        env.literal('http://example.org/page/(?<id>.+)/(?<missing>.+)'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('http://example.org/page/123/')
  })

  it('should transform URL with dictionary reverse-lookup for mapped variables', async function () {
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
    const transform = new PageUrlTransform(patterns, env, constraints)
    const input = [
      env.quad(
        env.namedNode('http://schema.org/Person'),
        env.ns.schema.mainEntityOfPage,
        env.literal('^https://example.com/(?<prefix>schema|foaf):(?<term>[a-zA-Z0-9_-]+).html$'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('https://example.com/schema:Person.html')
    expect(output[0].object.termType).to.equal('NamedNode')
  })

  it('should transform custom predicate declared in property shapes', async function () {
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
    const transform = new PageUrlTransform(patterns, env, constraints)
    const input = [
      env.quad(
        env.namedNode('http://xmlns.com/foaf/0.1/'),
        customPredicate,
        env.literal('^https://example.com/about/(?<prefix>schema|foaf).html$'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('https://example.com/about/foaf.html')
    expect(output[0].object.termType).to.equal('NamedNode')
  })

  it('should reverse-map dictionary constraints for destination page pattern without passing caller page constraints', async function () {
    // given
    const patterns: Bindings[] = [{
      pagePattern: env.literal('^https://example.com/(?<prefix>schema|foaf):(?<term>[a-zA-Z0-9_-]+).html$'),
      resourcePattern: env.literal('^(?<prefix>http://schema\\.org/|http://xmlns\\.com/foaf/0\\.1/)(?<term>[a-zA-Z0-9_-]+)$'),
      path: env.ns.schema.mainEntity,
    }]
    // Current page / caller does not pass constraints
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(
        env.namedNode('http://schema.org/Person'),
        env.ns.schema.mainEntityOfPage,
        env.literal('^https://example.com/(?<prefix>schema|foaf):(?<term>[a-zA-Z0-9_-]+).html$'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('https://example.com/schema:Person.html')
    expect(output[0].object.termType).to.equal('NamedNode')
  })

  it('should reverse-map single-entry dictionary constraints with special regex characters without passing caller constraints', async function () {
    // given
    const patterns: Bindings[] = [{
      pagePattern: env.literal('^https://example.com/(?<dict>foo\\.bar)/(?<id>[0-9]+).html$'),
      resourcePattern: env.literal('^http://example\\.org/(?<dict>foo\\.bar)/(?<id>[0-9]+)$'),
      path: env.ns.schema.mainEntityOfPage,
    }]
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(
        env.namedNode('http://example.org/foo.bar/42'),
        env.ns.schema.mainEntityOfPage,
        env.literal('^https://example.com/(?<dict>foo\\.bar)/(?<id>[0-9]+).html$'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('https://example.com/foo.bar/42.html')
    expect(output[0].object.termType).to.equal('NamedNode')
  })

  it('should support nested groups/parentheses in pagePattern without leaving dangling parentheses', async function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('^http://example.org/page/(?<id>(user|admin)_[0-9]+).html$'),
      resourcePattern: env.literal('^http://example.org/resource/(?<id>(user|admin)_[0-9]+)$'),
    }]
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(
        env.namedNode('http://example.org/resource/user_123'),
        env.ns.schema.mainEntityOfPage,
        env.literal('^http://example.org/page/(?<id>(user|admin)_[0-9]+).html$'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('http://example.org/page/user_123.html')
    expect(output[0].object.termType).to.equal('NamedNode')
  })

  it('should support multiple nested groups and optional parameters in pagePattern', async function () {
    // given
    const patterns: Bindings[] = [{
      path: env.ns.schema.mainEntityOfPage,
      pagePattern: env.literal('^http://example.org/(?<lang>(en|de))/(?<type>(user|org))/(?<id>[0-9]+)(?<ext>\\.(json|html))?$'),
      resourcePattern: env.literal('^http://example.org/(?<lang>(en|de))/(?<type>(user|org))/(?<id>[0-9]+)$'),
    }]
    const transform = new PageUrlTransform(patterns, env)
    const input = [
      env.quad(
        env.namedNode('http://example.org/en/user/42'),
        env.ns.schema.mainEntityOfPage,
        env.literal('^http://example.org/(?<lang>(en|de))/(?<type>(user|org))/(?<id>[0-9]+)(?<ext>\\.(json|html))?$'),
      ),
    ]

    // when
    const output = await collectQuads(Readable.from(input).pipe(transform))

    // then
    expect(output).to.have.length(1)
    expect(output[0].object.value).to.equal('http://example.org/en/user/42')
    expect(output[0].object.termType).to.equal('NamedNode')
  })
})

async function collectQuads(stream: Readable): Promise<Quad[]> {
  const result: Quad[] = []
  for await (const quad of stream) {
    result.push(quad as Quad)
  }
  return result
}
