import { expect } from 'chai'
import env from '@zazuko/env-node'
import sinon from 'sinon'
import { Generator, Parser } from 'sparqljs'
import SparqlProcessor from '../../lib/SparqlProcessor.js'
import { logger } from '../../lib/logger.js'

const prefixes = 'PREFIX kopflos: <https://kopflos.described.at/> PREFIX schema: <http://schema.org/>'

describe('@kopflos-labs/pages/lib/SparqlProcessor', function () {
  it('translates deprecated SERVICE syntax and logs a warning', function () {
    const warn = sinon.stub(logger, 'warn')
    try {
      const processor = new SparqlProcessor(env)
      const parsed = new Parser().parse(`${prefixes}
        CONSTRUCT { ?resource schema:mainEntityOfPage ?page }
        WHERE { SERVICE kopflos:Pages { ?resource schema:mainEntityOfPage ?page } }`)
      const rewritten = processor.process(JSON.parse(JSON.stringify(parsed)))
      const query = new Generator().stringify(rewritten)
      expect(query).to.contain('BIND(').and.contain('pageUrl')
      expect(query).not.to.contain('SERVICE')
      expect(query).not.to.contain('VALUES')
      expect(processor.usesPageUrl).to.be.true
      expect(warn).to.have.been.calledOnceWith(sinon.match('deprecated'))
    }
    finally {
      warn.restore()
    }
  })

  for (const contents of ['', 'FILTER(true)']) {
    it(`warns when a legacy SERVICE has no supported triples: ${contents || 'empty group'}`, function () {
      const warn = sinon.stub(logger, 'warn')
      try {
        const processor = new SparqlProcessor(env)
        const parsed = new Parser().parse(`${prefixes}
          CONSTRUCT { ?resource schema:mainEntityOfPage ?page }
          WHERE { SERVICE kopflos:Pages { ${contents} } }`)
        processor.process(parsed)
        expect(warn).to.have.been.calledWith(sinon.match('deprecated'))
        expect(warn).to.have.been.calledWith('No supported triple patterns found in SERVICE kopflos:Pages')
        expect(processor.usesPageUrl).to.be.false
      }
      finally {
        warn.restore()
      }
    })
  }

  it('preserves other SERVICE clauses', function () {
    const processor = new SparqlProcessor(env)
    const parsed = new Parser().parse('CONSTRUCT { ?s ?p ?o } WHERE { SERVICE <https://example.com/sparql> { ?s ?p ?o } }')
    expect(new Generator().stringify(processor.process(parsed))).to.contain('SERVICE <https://example.com/sparql>')
    expect(processor.usesPageUrl).to.be.false
  })

  it('recognizes pageUrl calls in nested expressions', function () {
    const processor = new SparqlProcessor(env)
    processor.process(new Parser().parse(`${prefixes} CONSTRUCT { ?s schema:url ?page } WHERE {
      OPTIONAL { BIND(STR(kopflos:pageUrl(?s, schema:about)) AS ?page) }
    }`))
    expect(processor.usesPageUrl).to.be.true
  })

  it('recognizes pageUrl in SELECT subqueries', function () {
    const processor = new SparqlProcessor(env)
    processor.process(new Parser().parse(`${prefixes} CONSTRUCT { ?resource schema:url ?page } WHERE {
      { SELECT ?resource ?page WHERE {
        ?resource schema:name ?name .
        BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?page)
      } }
    }`))
    expect(processor.usesPageUrl).to.be.true
  })

  for (const args of ['?s', '?s, schema:about, schema:name']) {
    it(`rejects invalid arity: ${args}`, function () {
      const processor = new SparqlProcessor(env)
      expect(() => processor.process(new Parser().parse(`${prefixes}
        CONSTRUCT { ?s schema:url ?page } WHERE { BIND(kopflos:pageUrl(${args}) AS ?page) }`)))
        .to.throw('requires two arguments')
    })
  }
})
