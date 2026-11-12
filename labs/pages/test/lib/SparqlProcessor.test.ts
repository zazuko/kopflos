import { expect, use } from 'chai'
import env from '@zazuko/env-node'
import sinon from 'sinon'
import { Generator, Parser } from 'sparqljs'
import type { SparqlQuery } from 'sparqljs'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import SparqlProcessor from '../../lib/SparqlProcessor.js'
import { logger } from '../../lib/logger.js'

const prefixes = 'PREFIX kopflos: <https://kopflos.described.at/> PREFIX schema: <http://schema.org/>'

function serializeQuery(query: SparqlQuery): string {
  const variables = new Map<string, string>()
  return new Generator().stringify(query).replace(/\?__kopflos_pageUrl_[a-f0-9]{32}\b/g, (variable) => {
    // Keep generated names stable while preserving distinct bindings and references.
    if (!variables.has(variable)) variables.set(variable, `?__kopflos_pageUrl_${variables.size}`)
    return variables.get(variable)!
  })
}

describe('@kopflos-labs/pages/lib/SparqlProcessor', function () {
  use(jestSnapshotPlugin())

  afterEach(function () {
    sinon.restore()
  })

  for (const expression of ['BIND(<urn:custom>(?s) AS ?value)', 'FILTER(<urn:custom>(?s))']) {
    it(`preserves ordinary custom functions in ${expression}`, function () {
      // Given
      const processor = new SparqlProcessor(env)
      const parsed = new Parser().parse(`SELECT * WHERE { ?s ?p ?o . ${expression} }`)

      // When
      const rewritten = processor.process(parsed)

      // Then
      expect(serializeQuery(rewritten)).to.equal(serializeQuery(parsed))
      expect(processor.usesPageUrl).to.be.false
    })
  }

  for (const triple of ['?s schema:about <urn:page>', '?s schema:about/schema:url ?page', '[] schema:about ?page']) {
    it(`rejects unsupported legacy SERVICE triples: ${triple}`, function () {
      // Given
      sinon.stub(logger, 'warn')
      const processor = new SparqlProcessor(env)
      const parsed = new Parser().parse(`${prefixes} SELECT * WHERE { SERVICE kopflos:Pages { ${triple} } }`)

      // When
      const process = () => processor.process(parsed)

      // Then
      expect(process).to.throw('Deprecated SERVICE kopflos:Pages requires a variable object and a simple relationship')
      expect(processor.usesPageUrl).to.be.false
    })
  }

  it('translates a NamedNode subject in a legacy SERVICE', function () {
    // Given
    sinon.stub(logger, 'warn')
    const processor = new SparqlProcessor(env)
    const parsed = new Parser().parse(`${prefixes} SELECT * WHERE {
      SERVICE kopflos:Pages { <urn:resource> schema:mainEntityOfPage ?page }
    }`)

    // When
    const rewritten = processor.process(parsed)
    const query = serializeQuery(rewritten)

    // Then
    expect(query).toMatchSnapshot()
    expect(processor.usesPageUrl).to.be.true
  })

  it('translates deprecated SERVICE syntax and logs a warning', function () {
    // Given
    const warn = sinon.stub(logger, 'warn')
    const processor = new SparqlProcessor(env)
    const parsed = new Parser().parse(`${prefixes}
      CONSTRUCT { ?resource schema:mainEntityOfPage ?page }
      WHERE { SERVICE kopflos:Pages { ?resource schema:mainEntityOfPage ?page } }`)
    const compiled = JSON.parse(JSON.stringify(parsed))

    // When
    const rewritten = processor.process(compiled)
    const query = serializeQuery(rewritten)

    // Then
    expect(query).toMatchSnapshot()
    expect(processor.usesPageUrl).to.be.true
    expect(warn).to.have.been.calledOnceWith(sinon.match('deprecated'))
  })

  for (const contents of ['', 'FILTER(true)']) {
    it(`warns when a legacy SERVICE has no supported triples: ${contents || 'empty group'}`, function () {
      // Given
      const warn = sinon.stub(logger, 'warn')
      const processor = new SparqlProcessor(env)
      const parsed = new Parser().parse(`${prefixes}
        CONSTRUCT { ?resource schema:mainEntityOfPage ?page }
        WHERE { SERVICE kopflos:Pages { ${contents} } }`)

      // When
      const rewritten = processor.process(parsed)
      const query = serializeQuery(rewritten)

      // Then
      expect(query).toMatchSnapshot()
      expect(warn).to.have.been.calledWith(sinon.match('deprecated'))
      expect(warn).to.have.been.calledWith('No supported triple patterns found in SERVICE kopflos:Pages')
      expect(processor.usesPageUrl).to.be.false
    })
  }

  it('preserves other SERVICE clauses', function () {
    // Given
    const processor = new SparqlProcessor(env)
    const parsed = new Parser().parse('CONSTRUCT { ?s ?p ?o } WHERE { SERVICE <https://example.com/sparql> { ?s ?p ?o } }')

    // When
    const rewritten = processor.process(parsed)
    const query = serializeQuery(rewritten)

    // Then
    expect(query).toMatchSnapshot()
    expect(processor.usesPageUrl).to.be.false
  })

  it('recognizes exact pageUrl bindings inside OPTIONAL', function () {
    // Given
    const processor = new SparqlProcessor(env)
    const parsed = new Parser().parse(`${prefixes} CONSTRUCT { ?s schema:url ?page } WHERE {
      OPTIONAL { BIND(kopflos:pageUrl(?s, schema:about) AS ?page) }
    }`)

    // When
    const rewritten = processor.process(parsed)
    const query = serializeQuery(rewritten)

    // Then
    expect(query).toMatchSnapshot()
    expect(processor.usesPageUrl).to.be.true
  })

  it('rejects pageUrl outside BIND', function () {
    // Given
    const processor = new SparqlProcessor(env)
    const parsed = new Parser().parse(`${prefixes}
      CONSTRUCT { ?s schema:url ?page } WHERE {
        FILTER(ISIRI(kopflos:pageUrl(?s, schema:about)))
      }`)

    // When
    const process = () => processor.process(parsed)

    // Then
    expect(process).to.throw('within a BIND expression')
    expect(processor.usesPageUrl).to.be.false
  })

  it('keeps extracted bindings inside their own BIND and OPTIONAL scopes', function () {
    // Given
    const processor = new SparqlProcessor(env)
    const parsed = new Parser().parse(`${prefixes}
      CONSTRUCT { ?s schema:url ?url } WHERE {
        BIND(CONCAT(STR(kopflos:pageUrl(?s, schema:about)), "#details") AS ?url)
        OPTIONAL { BIND(STR(kopflos:pageUrl(?s, schema:mainEntity)) AS ?other) }
        BIND("unchanged" AS ?label)
      }`)

    // When
    const rewritten = processor.process(parsed)
    const query = serializeQuery(rewritten)

    // Then
    expect(query).toMatchSnapshot()
    expect(processor.usesPageUrl).to.be.true
  })

  it('recognizes pageUrl in SELECT subqueries', function () {
    // Given
    const processor = new SparqlProcessor(env)
    const parsed = new Parser().parse(`${prefixes} CONSTRUCT { ?resource schema:url ?page } WHERE {
      { SELECT ?resource ?page WHERE {
        ?resource schema:name ?name .
        BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)
      } }
    }`)

    // When
    const rewritten = processor.process(parsed)
    const query = serializeQuery(rewritten)

    // Then
    expect(query).toMatchSnapshot()
    expect(processor.usesPageUrl).to.be.true
  })

  for (const args of ['', '?s', '?s, schema:about, schema:name']) {
    it(`defers invalid arity to expression evaluation: ${args}`, function () {
      // Given
      const processor = new SparqlProcessor(env)
      const parsed = new Parser().parse(`${prefixes}
        CONSTRUCT { ?s schema:url ?page } WHERE { BIND(kopflos:pageUrl(${args}) AS ?page) }`)

      // When
      const rewritten = processor.process(parsed)
      const query = serializeQuery(rewritten)

      // Then
      expect(query).toMatchSnapshot()
      expect(processor.usesPageUrl).to.be.true
    })
  }
})
