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
})

async function collectQuads(stream: Readable): Promise<Quad[]> {
  const result: Quad[] = []
  for await (const quad of stream) {
    result.push(quad as Quad)
  }
  return result
}
