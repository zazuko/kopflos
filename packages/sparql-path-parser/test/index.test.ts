import { expect, use } from 'chai'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { toSparql } from 'clownface-shacl-path'
import { parse } from '../src/index.js'

describe('sparql-path-parser', () => {
  use(jestSnapshotPlugin())

  describe('parse', () => {
    [
      'schema:foo / schema:bar', // test whitespace is ignored
      '!(rdf:type|^rdf:type)',
    ]
      .forEach((path) => {
        it(`'${path}'`, () => {
          expect(toSparql(parse(path)).toString({ prologue: false })).toMatchSnapshot()
        })
      })
  })
})
