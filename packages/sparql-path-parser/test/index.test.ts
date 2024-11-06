import { expect, use } from 'chai'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { toSparql } from 'clownface-shacl-path'
import { parse } from '../src/index.js'

describe('sparql-path-parser', () => {
  use(jestSnapshotPlugin())

  const paths = [
      'schema:foo / schema:bar', // test whitespace is ignored
      '!(rdf:type|^rdf:type)',
      '!a',
      '^rdf:type',
      '(rdf:type)', // pathPrimary in parens
      'schema:sameAs|owl:sameAs',
      'schema:knows+',
      'schema:knows*',
      'schema:knows?',
      'rdf:rest*/rdf:first',
      'a/schema:name',
      '<foo>', // relative unchanged
      '<http://schema.org/image>',
    ]

  describe('parse', () => {
    paths.forEach((path) => {
        it(`'${path}'`, () => {
          expect(toSparql(parse(path)).toString({ prologue: false })).toMatchSnapshot()
        })
      })
  })

  describe('parse with baseIRI', () => {
    paths.forEach((path) => {
      it(`'${path}'`, () => {
        expect(toSparql(parse(path, { baseIRI: 'http://example.com/' })).toString({prologue: false})).toMatchSnapshot()
      })
    })
  })
})
