import { expect } from 'chai'
import { validateConstraints } from '../../lib/constraints.js'

describe('@kopflos-labs/pages/lib/constraints.js', function () {
  describe('validateConstraints', function () {
    it('should return true when no constraints or subjectVariables are provided', function () {
      expect(validateConstraints({})).to.be.true
      expect(validateConstraints({}, { foo: 'bar' })).to.be.true
    })

    it('should return true when variable is not in subjectVariables', function () {
      expect(validateConstraints({ term: /^[a-z]+$/ }, {})).to.be.true
      expect(validateConstraints({ term: /^[a-z]+$/ }, { other: '123' })).to.be.true
    })

    describe('RegExp constraint', function () {
      const constraints = { term: /^[a-zA-Z0-9_-]+$/ }

      it('should return true when value matches RegExp', function () {
        expect(validateConstraints(constraints, { term: 'valid-term_123' })).to.be.true
      })

      it('should return false when value does not match RegExp', function () {
        expect(validateConstraints(constraints, { term: 'invalid/term!' })).to.be.false
      })
    })


    describe('Array constraint', function () {
      const constraints = { lang: ['en', 'de', 'fr'] }

      it('should return true when value is included in Array', function () {
        expect(validateConstraints(constraints, { lang: 'en' })).to.be.true
        expect(validateConstraints(constraints, { lang: 'de' })).to.be.true
      })

      it('should return true when value is in readonly array', function () {
        const readonlyConstraints = { lang: ['en', 'de', 'fr'] as const }
        expect(validateConstraints(readonlyConstraints, { lang: 'fr' })).to.be.true
      })

      it('should return false when value is not included in Array', function () {
        expect(validateConstraints(constraints, { lang: 'es' })).to.be.false
      })
    })


    describe('Dictionary / Object constraint', function () {
      const constraints = {
        prefix: {
          schema: 'http://schema.org/',
          foaf: 'http://xmlns.com/foaf/0.1/',
        },
      }

      it('should return true when key exists on Object', function () {
        expect(validateConstraints(constraints, { prefix: 'schema' })).to.be.true
        expect(validateConstraints(constraints, { prefix: 'foaf' })).to.be.true
      })

      it('should return false when key does not exist on Object', function () {
        expect(validateConstraints(constraints, { prefix: 'unknown' })).to.be.false
      })
    })

    describe('Multiple constraints', function () {
      const constraints = {
        prefix: { schema: 'http://schema.org/' },
        term: /^[a-z]+$/,
        lang: ['en', 'de'],
      }

      it('should return true when all constraints pass', function () {
        expect(validateConstraints(constraints, {
          prefix: 'schema',
          term: 'person',
          lang: 'en',
        })).to.be.true
      })

      it('should return false when any constraint fails', function () {
        expect(validateConstraints(constraints, {
          prefix: 'schema',
          term: '1234',
          lang: 'en',
        })).to.be.false

        expect(validateConstraints(constraints, {
          prefix: 'unknown',
          term: 'person',
          lang: 'en',
        })).to.be.false

        expect(validateConstraints(constraints, {
          prefix: 'schema',
          term: 'person',
          lang: 'fr',
        })).to.be.false
      })
    })
  })
})
