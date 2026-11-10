import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'
import { expect } from 'chai'
import sinon from 'sinon'
import env from '@zazuko/env-node'
import { QueryEngine } from '@comunica/query-sparql'
import StreamClient from 'sparql-http-client/StreamClient.js'
import { Generator, Parser } from 'sparqljs'
import { createPageUrlExtension } from '../../lib/pageUrl.js'
import { queryClient } from '../../lib/queryClient.js'
import SparqlProcessor from '../../lib/SparqlProcessor.js'

const prefixes = 'PREFIX kopflos: <https://kopflos.described.at/> PREFIX schema: <http://schema.org/>'
const resource = env.namedNode('http://example.org/resource/123')
const page = env.namedNode('http://example.org/page/123')
const patterns = [{
  path: env.ns.schema.mainEntity,
  pagePattern: env.literal('^http://example.org/page/(?<id>.+)$'),
  resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
}]

describe('Pages query client', function () {
  this.timeout(20000)

  function setup() {
    const remoteEngine = new QueryEngine()
    const dataset = env.dataset([env.quad(resource, env.ns.schema.name, env.literal('Resource'))])
    const requests: string[] = []
    const client = new StreamClient({
      endpointUrl: 'https://example.com/sparql',
      user: 'user',
      password: 'password',
      fetch: async (_input, init) => {
        expect(new Headers(init?.headers).get('authorization')).to.equal('Basic dXNlcjpwYXNzd29yZA==')
        const query = String(init?.body ?? '')
        if (!query) return new Response('', { headers: { 'content-type': 'text/turtle' } })
        requests.push(query)
        expect(query).not.to.match(/pageUrl>?\s*\(/)
        expect(query).not.to.contain('kopflos.described.at/Pages')
        const result = await remoteEngine.query(query, { sources: [dataset] })
        const serialized = await remoteEngine.resultToString(result, 'application/sparql-results+json')
        // Exercise adaptation of sparql-http-client's Node response body.
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/sparql-results+json' }),
          body: Readable.from(serialized.data),
        } as unknown as Response
      },
    })
    return { client, requests }
  }

  async function run(where: string, template = '?page schema:mainEntity ?resource ; schema:url ?page', routes = patterns) {
    const { client, requests } = setup()
    const processor = new SparqlProcessor(env)
    const query = new Generator().stringify(processor.process(new Parser().parse(`${prefixes}
      CONSTRUCT { ${template} } WHERE { ?resource schema:name ?name . ${where} }`)))
    const stream = queryClient(client, processor, createPageUrlExtension(routes, env)).query.construct(query)
    const quads = []
    for await (const quad of stream) quads.push(quad)
    return { dataset: env.dataset(quads), requests }
  }

  it('resolves locally before FILTER and CONSTRUCT, including page subjects and unrelated predicates', async function () {
    const { dataset, requests } = await run(`
      BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)
      FILTER(?page = <${page.value}>)`)
    expect(dataset.has(env.quad(page, env.ns.schema.mainEntity, resource))).to.be.true
    expect(dataset.has(env.quad(page, env.ns.schema.url, page))).to.be.true
    expect(dataset.size).to.equal(2)
    expect(requests.length).to.be.greaterThan(0)
  })

  it('keeps other data when no page matches', async function () {
    const { dataset } = await run('BIND(kopflos:pageUrl(?resource, schema:about) AS ?page)',
      '?resource schema:name ?name ; schema:url ?page')
    expect(dataset.size).to.equal(1)
    expect(dataset.has(env.quad(resource, env.ns.schema.name, env.literal('Resource')))).to.be.true
  })

  for (const args of ['"literal", schema:mainEntity', '?resource, "literal"', '?missing, schema:mainEntity']) {
    it(`leaves the page unbound for invalid or unbound arguments: ${args}`, async function () {
      const { dataset } = await run(`BIND(kopflos:pageUrl(${args}) AS ?page)`,
        '?resource schema:name ?name ; schema:url ?page')
      expect(dataset.size).to.equal(1)
    })
  }

  it('leaves ambiguous pages unbound without aborting the query', async function () {
    const { dataset } = await run('BIND(kopflos:pageUrl(?resource, schema:mainEntity) AS ?page)',
      '?resource schema:name ?name ; schema:url ?page',
      [...patterns, { ...patterns[0], pagePattern: env.literal('http://example.org/other/(?<id>.+)') }])
    expect(dataset.size).to.equal(1)
  })

  it('supports nested function expressions without pushing pageUrl to the endpoint', async function () {
    const { dataset } = await run('BIND(STR(kopflos:pageUrl(?resource, schema:mainEntityOfPage)) AS ?url)',
      '?resource schema:url ?url')
    expect(dataset.has(env.quad(resource, env.ns.schema.url, env.literal(page.value)))).to.be.true
  })

  it('keeps failed resolutions inside OPTIONAL from dropping other data', async function () {
    const { dataset } = await run(`OPTIONAL {
      BIND(kopflos:pageUrl(?resource, schema:about) AS ?page)
      FILTER(BOUND(?page))
    }`, '?resource schema:name ?name ; schema:url ?page')
    expect(dataset.size).to.equal(1)
  })

  it('resolves inside a subquery', async function () {
    const { dataset } = await run(`{ SELECT ?resource ?page WHERE {
      ?resource schema:name ?label .
      BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)
    } }`)
    expect(dataset.has(env.quad(page, env.ns.schema.mainEntity, resource))).to.be.true
  })

  it('executes the deprecated SERVICE through the same resolver', async function () {
    const { dataset } = await run('SERVICE kopflos:Pages { ?resource schema:mainEntityOfPage ?page }')
    expect(dataset.has(env.quad(page, env.ns.schema.mainEntity, resource))).to.be.true
  })

  it('delegates queries without page resolution to the original client', async function () {
    const { client } = setup()
    const construct = sinon.stub(client.query, 'construct').returns(Readable.from([]))
    const query = 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }'
    const stream = queryClient(client, new SparqlProcessor(env), createPageUrlExtension(patterns, env)).query.construct(query)
    stream.resume()
    await finished(stream)
    expect(construct).to.have.been.calledOnceWith(query)
  })

  it('propagates endpoint failures', async function () {
    const { client } = setup()
    sinon.stub(client, 'postDirect').rejects(new Error('Endpoint unavailable'))
    const processor = new SparqlProcessor(env)
    processor.usesPageUrl = true
    const stream = queryClient(client, processor, createPageUrlExtension(patterns, env)).query.construct(`${prefixes}
      CONSTRUCT { ?resource schema:url ?page } WHERE {
        ?resource schema:name ?name . BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)
      }`)
    stream.resume()
    await expect(finished(stream)).to.be.rejectedWith('Endpoint unavailable')
  })
})
