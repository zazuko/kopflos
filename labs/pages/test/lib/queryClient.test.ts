import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'
import { expect } from 'chai'
import sinon from 'sinon'
import env from '@zazuko/env-node'
import { QueryEngine } from '@comunica/query-sparql'
import StreamClient from 'sparql-http-client/StreamClient.js'
import { Generator, Parser } from 'sparqljs'
import type { ValuesPattern } from 'sparqljs'
import { createPageUrlExtension } from '../../lib/pageUrl.js'
import { queryClient } from '../../lib/queryClient.js'
import SparqlProcessor from '../../lib/SparqlProcessor.js'
import { createInMemoryClients } from '../../../../packages/in-memory/index.js'

const prefixes = 'PREFIX kopflos: <https://kopflos.described.at/> PREFIX schema: <http://schema.org/>'
const resource = env.namedNode('http://example.org/resource/123')
const page = env.namedNode('http://example.org/page/123')
const patterns = [{
  path: env.ns.schema.mainEntity,
  pagePattern: env.literal('^http://example.org/page/(?<id>.+)$'),
  resourcePattern: env.literal('^http://example.org/resource/(?<id>.+)$'),
}]

interface PhysicalPlanNode {
  logical: string
  physical?: string
  children?: PhysicalPlanNode[]
}

function planNodes(node: PhysicalPlanNode): PhysicalPlanNode[] {
  return [node, ...(node.children || []).flatMap(planNodes)]
}

describe('Pages query client', function () {
  this.timeout(20000)

  for (const resolution of [
    'BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)',
    'SERVICE kopflos:Pages { ?resource schema:mainEntityOfPage ?page }',
  ]) {
    it(`resolves pages with the in-memory client: ${resolution}`, async function () {
      // Given
      const { stream: client } = createInMemoryClients()
      await client.query.update(`INSERT DATA { GRAPH <urn:data> { <${resource.value}> <http://schema.org/name> "Resource" } }`)
      const processor = new SparqlProcessor(env)
      const query = new Generator().stringify(processor.process(new Parser().parse(`${prefixes}
        CONSTRUCT { ?resource schema:mainEntityOfPage ?page ; schema:name ?name }
        WHERE { ?resource schema:name ?name . ${resolution} FILTER(BOUND(?page)) }`)))

      // When
      const result = await env.dataset().import(queryClient(client, processor, createPageUrlExtension(patterns, env), env).query.construct(query))

      // Then
      expect(result.size).to.equal(2)
      expect(result.has(env.quad(resource, env.ns.schema.mainEntityOfPage, page))).to.be.true
      expect(result.has(env.quad(resource, env.ns.schema.name, env.literal('Resource')))).to.be.true
    })
  }

  it('preserves named graphs and RDF term types with the in-memory client', async function () {
    // Given
    const { stream: client } = createInMemoryClients()
    await client.query.update(`INSERT DATA { GRAPH <urn:data> {
      <${resource.value}> <http://schema.org/name> "Ressource"@de ; <http://schema.org/value> 42 ; <http://schema.org/about> _:detail .
    } }`)
    const processor = new SparqlProcessor(env)
    const query = new Generator().stringify(processor.process(new Parser().parse(`${prefixes}
      CONSTRUCT { ?page schema:name ?name ; schema:value ?value ; schema:about ?detail ; schema:isPartOf ?graph }
      WHERE { GRAPH ?graph { ?resource schema:name ?name ; schema:value ?value ; schema:about ?detail }
        BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page) }`)))

    // When
    const result = await env.dataset().import(queryClient(client, processor, createPageUrlExtension(patterns, env), env).query.construct(query))

    // Then
    expect(result.size).to.equal(4)
    expect(result.has(env.quad(page, env.ns.schema.name, env.literal('Ressource', 'de')))).to.be.true
    expect(result.has(env.quad(page, env.ns.schema.value, env.literal('42', env.ns.xsd.integer)))).to.be.true
    expect(result.has(env.quad(page, env.ns.schema.isPartOf, env.namedNode('urn:data')))).to.be.true
    expect([...result.match(page, env.ns.schema.about)][0].object.termType).to.equal('BlankNode')
  })

  function setup(quads = [env.quad(resource, env.ns.schema.name, env.literal('Resource'))], endpointUrl = 'https://example.com/sparql') {
    const remoteEngine = new QueryEngine()
    const dataset = env.dataset(quads)
    const requests: string[] = []
    const client = new StreamClient({
      endpointUrl,
      user: 'user',
      password: 'password',
      fetch: async (input, init) => {
        expect(new Headers(init?.headers).get('authorization')).to.equal('Basic dXNlcjpwYXNzd29yZA==')
        const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
        const body = String(init?.body ?? '')
        const query = url.searchParams.get('query') ?? new URLSearchParams(body).get('query') ?? body
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

  it('queries configured and SERVICE graphs through the same authenticated transport', async function () {
    // Given
    const { client, requests } = setup(undefined, 'https://example.com/sparql?default-graph-uri=urn:a')
    const configuredFetch = client.fetch
    client.headers!.set('x-client', 'custom')
    const serviceEngine = new QueryEngine()
    const serviceData = env.dataset([env.quad(resource, env.ns.schema.description, env.literal('From graph b'))])
    const serviceRequests: string[] = []
    sinon.stub(client, 'fetch').callsFake(async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
      expect(new Headers(init?.headers).get('authorization')).to.equal(client.headers!.get('authorization'))
      expect(new Headers(init?.headers).get('x-client')).to.equal('custom')
      if (url.searchParams.get('default-graph-uri') === 'urn:a') return configuredFetch(input, init)
      const body = String(init?.body ?? '')
      const query = url.searchParams.get('query') ?? new URLSearchParams(body).get('query') ?? body
      expect(url.searchParams.get('default-graph-uri')).to.equal('urn:b')
      if (!query) return new Response(`<> <http://www.w3.org/ns/sparql-service-description#endpoint> <${url.href}> .`, { headers: { 'content-type': 'text/turtle' } })
      serviceRequests.push(query)
      const result = await serviceEngine.query(query, { sources: [serviceData] })
      const serialized = await serviceEngine.resultToString(result, 'application/sparql-results+json')
      return new Response(Readable.toWeb(Readable.from(serialized.data)) as ReadableStream, { headers: { 'content-type': 'application/sparql-results+json' } })
    })
    const externalFetch = sinon.stub(globalThis, 'fetch').rejects(new Error('Same-endpoint queries must use the configured transport'))
    const processor = new SparqlProcessor(env)
    const query = new Generator().stringify(processor.process(new Parser().parse(`${prefixes}
      CONSTRUCT { ?page schema:name ?name ; schema:description ?description }
      WHERE {
        ?resource schema:name ?name .
        SERVICE <https://example.com/sparql?default-graph-uri=urn:b> { ?resource schema:description ?description }
        BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)
      }`)))

    try {
      // When
      const result = await env.dataset().import(queryClient(client, processor, createPageUrlExtension(patterns, env), env).query.construct(query))

      // Then
      expect(result.size).to.equal(2)
      expect(result.has(env.quad(page, env.ns.schema.name, env.literal('Resource')))).to.be.true
      expect(result.has(env.quad(page, env.ns.schema.description, env.literal('From graph b')))).to.be.true
      expect(serviceRequests.length).to.be.greaterThan(0)
      expect(requests.length).to.be.greaterThan(0)
      expect(externalFetch).not.to.have.been.called
    }
    finally {
      externalFetch.restore()
    }
  })

  async function run(where: string, template = '?page schema:mainEntity ?resource ; schema:url ?page', routes = patterns) {
    const { client, requests } = setup()
    const processor = new SparqlProcessor(env)
    const query = new Generator().stringify(processor.process(new Parser().parse(`${prefixes}
      CONSTRUCT { ${template} } WHERE { ?resource schema:name ?name . ${where} }`)))
    const stream = queryClient(client, processor, createPageUrlExtension(routes, env), env).query.construct(query)
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

  it('joins resolved page IRIs with subsequent endpoint triple patterns', async function () {
    const secondResource = env.namedNode('http://example.org/resource/456')
    const secondPage = env.namedNode('http://example.org/page/456')
    const unrelatedPage = env.namedNode('http://example.org/page/unrelated')
    const { client, requests } = setup([
      env.quad(resource, env.ns.schema.name, env.literal('Resource')),
      env.quad(secondResource, env.ns.schema.name, env.literal('Second resource')),
      env.quad(page, env.ns.schema.headline, env.literal('First page')),
      env.quad(secondPage, env.ns.schema.headline, env.literal('Second page')),
      env.quad(unrelatedPage, env.ns.schema.headline, env.literal('Unrelated page')),
    ])
    const processor = new SparqlProcessor(env)
    const query = new Generator().stringify(processor.process(new Parser().parse(`${prefixes}
      CONSTRUCT { ?resource schema:mainEntityOfPage ?page . ?page schema:headline ?title }
      WHERE {
        ?resource schema:name ?name .
        BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)
        ?page schema:headline ?title .
      }`)))
    // Capture the actual execution context so explain uses the production
    // sources, extension function, and authenticated fetch adapter unchanged.
    const execution = sinon.spy(QueryEngine.prototype, 'queryQuads')
    let result
    let explained
    let executionRequests: string[]
    let explainRequests: string[]
    try {
      result = await env.dataset().import(queryClient(client, processor, createPageUrlExtension(patterns, env), env).query.construct(query))
      executionRequests = [...requests]
      requests.length = 0
      const call = execution.firstCall
      explained = await call.thisValue.explain(query, { ...call.args[1] }, 'physical-json')
      explainRequests = [...requests]
    }
    finally {
      execution.restore()
    }
    expect(result.size).to.equal(4)
    expect(result.has(env.quad(resource, env.ns.schema.mainEntityOfPage, page))).to.be.true
    expect(result.has(env.quad(secondResource, env.ns.schema.mainEntityOfPage, secondPage))).to.be.true
    expect(result.has(env.quad(page, env.ns.schema.headline, env.literal('First page')))).to.be.true
    expect(result.has(env.quad(secondPage, env.ns.schema.headline, env.literal('Second page')))).to.be.true
    expect(result.match(unrelatedPage).size).to.equal(0)
    expect(explained.explain).to.be.true
    expect(explained.type).to.equal('physical-json')
    const nodes = planNodes(explained.data)
    expect(nodes.some(node => node.logical === 'join-inner' && node.physical === 'bind-source')).to.be.true
    expect(nodes.filter(node => node.logical === 'extend')).to.have.length(2)

    // For this fixture, both ordinary execution and physical explain use one
    // resource query followed by one batched VALUES lookup, not one per page.
    for (const queries of [executionRequests, explainRequests]) {
      expect(queries).to.have.length(2)
      const lookup = queries.find(request => request.includes('<http://schema.org/headline>'))
      expect(lookup).to.be.a('string')
      const parsed = new Parser().parse(lookup!)
      if (parsed.type !== 'query' || parsed.queryType !== 'SELECT') throw new Error('Expected a SELECT lookup')
      const values = parsed.where?.find((pattern): pattern is ValuesPattern => pattern.type === 'values')
      expect(values?.values.map(row => row['?page']?.value)).to.have.members([page.value, secondPage.value])
    }
  })

  it('keeps other data when no page matches', async function () {
    const { dataset } = await run('BIND(kopflos:pageUrl(?resource, schema:about) AS ?page)',
      '?resource schema:name ?name ; schema:url ?page')
    expect(dataset.size).to.equal(1)
    expect(dataset.has(env.quad(resource, env.ns.schema.name, env.literal('Resource')))).to.be.true
  })

  for (const args of ['', '?resource', '?resource, schema:mainEntity, schema:about', '"literal", schema:mainEntity', '?resource, "literal"', '?missing, schema:mainEntity']) {
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

  it('allows further expressions on a separately bound page IRI', async function () {
    const { dataset } = await run(`BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)
      BIND(STR(?page) AS ?url)`,
    '?resource schema:url ?url')
    expect(dataset.has(env.quad(resource, env.ns.schema.url, env.literal(page.value)))).to.be.true
  })

  it('supports sibling pageUrl calls composed with other functions', async function () {
    const { dataset } = await run(`BIND(CONCAT(
      STR(kopflos:pageUrl(?resource, schema:mainEntityOfPage)),
      "#",
      STR(kopflos:pageUrl(IRI(STR(?resource)), schema:mainEntity))
    ) AS ?url)`, '?resource schema:url ?url')
    expect(dataset.has(env.quad(resource, env.ns.schema.url, env.literal(`${page.value}#${page.value}`)))).to.be.true
  })

  it('resolves nested pageUrl calls in dependency order', async function () {
    const routes = [...patterns, {
      path: env.ns.schema.about,
      resourcePattern: env.literal('^http://example.org/page/(?<id>.+)$'),
      pagePattern: env.literal('http://example.org/landing/(?<id>.+)'),
    }]
    const { dataset } = await run(`BIND(kopflos:pageUrl(
      kopflos:pageUrl(?resource, schema:mainEntityOfPage), schema:about
    ) AS ?page)`, '?resource schema:url ?page', routes)
    expect(dataset.has(env.quad(resource, env.ns.schema.url, env.namedNode('http://example.org/landing/123')))).to.be.true
  })

  it('preserves COALESCE and IF behavior when an extracted call has no match', async function () {
    const { dataset } = await run(`
      BIND(COALESCE(STR(kopflos:pageUrl(?resource, schema:about)), "fallback") AS ?fallback)
      BIND(IF(true, "selected", STR(kopflos:pageUrl(?resource, schema:about))) AS ?selected)
    `, '?resource schema:name ?fallback ; schema:description ?selected')
    expect(dataset.has(env.quad(resource, env.ns.schema.name, env.literal('fallback')))).to.be.true
    expect(dataset.has(env.quad(resource, env.ns.schema.description, env.literal('selected')))).to.be.true
  })

  it('visits pageUrl calls inside IN tuples', async function () {
    const { dataset } = await run(`BIND(<${page.value}> IN (
      kopflos:pageUrl(?resource, schema:mainEntityOfPage), <http://example.org/other>
    ) AS ?matched)`, '?resource schema:value ?matched')
    expect(dataset.has(env.quad(resource, env.ns.schema.value, env.literal('true', env.ns.xsd.boolean)))).to.be.true
  })

  it('allows COALESCE to recover from missing pageUrl arguments', async function () {
    const { dataset } = await run('BIND(COALESCE(STR(kopflos:pageUrl(?resource)), "fallback") AS ?url)',
      '?resource schema:url ?url')
    expect(dataset.has(env.quad(resource, env.ns.schema.url, env.literal('fallback')))).to.be.true
  })

  it('keeps pageUrl calls in EXISTS graph patterns within their inner BIND scope', async function () {
    const { dataset } = await run(`BIND(EXISTS {
      VALUES ?target { <${resource.value}> }
      BIND(kopflos:pageUrl(?target, schema:mainEntityOfPage) AS ?inner)
      FILTER(?inner = <${page.value}>)
    } AS ?matched)`, '?resource schema:value ?matched')
    expect(dataset.has(env.quad(resource, env.ns.schema.value, env.literal('true', env.ns.xsd.boolean)))).to.be.true
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
    const stream = queryClient(client, new SparqlProcessor(env), createPageUrlExtension(patterns, env), env).query.construct(query)
    stream.resume()
    await finished(stream)
    expect(construct).to.have.been.calledOnceWith(query)
  })

  it('propagates endpoint failures', async function () {
    const { client } = setup()
    sinon.stub(client, 'postDirect').rejects(new Error('Endpoint unavailable'))
    const processor = new SparqlProcessor(env)
    processor.usesPageUrl = true
    const stream = queryClient(client, processor, createPageUrlExtension(patterns, env), env).query.construct(`${prefixes}
      CONSTRUCT { ?resource schema:url ?page } WHERE {
        ?resource schema:name ?name . BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)
      }`)
    stream.resume()
    await expect(finished(stream)).to.be.rejectedWith('Endpoint unavailable')
  })
})
