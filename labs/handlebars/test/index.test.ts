import { createStore } from 'mocha-chai-rdf/store.js'
import { expect } from 'chai'
import { createEnv } from '@kopflos-cms/core/env.js' // eslint-disable-line import/no-unresolved
import process from '../index.js'

describe('@kopflos-labs/handlebars', () => {
  beforeEach(createStore(import.meta.url, {
    format: 'ttl',
  }))

  const env = createEnv({
    baseIri: 'http://example.org/',
    sparql: {
      default: 'http://example.org/sparql',
    },
  })

  it("allows to use 'value' property of pointer", function () {
    const result = process('{{ pointer.value }}', {
      pointer: this.rdf.graph.namedNode('http://example.org/article'),
    }, env)

    expect(result).to.equal('http://example.org/article')
  })

  describe('valueof helper', () => {
    it('follows the path and prints value', function () {
      const result = process('{{ valueof "schema:image/schema:thumbnail/schema:contentUrl" }}', {
        pointer: this.rdf.graph.namedNode('http://example.org/article'),
      }, env)

      expect(result).to.equal('http://example.org/thumbnail.jpg')
    })

    it('prints parse error', function () {
      const result = process('{{{ valueof "schemaimage" }}}', {
        pointer: this.rdf.graph.namedNode('http://example.org/article'),
      }, env)

      expect(result).to.match(/mismatched input 'schemaimage'/)
    })
  })
})
