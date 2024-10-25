import * as antlr4 from 'antlr4' // eslint-disable-line import/no-extraneous-dependencies
import type { ShaclPropertyPath } from 'clownface-shacl-path'
import { toAlgebra } from 'clownface-shacl-path'
import type { PropertyPath } from 'sparqljs'
import type { NamedNode } from '@rdfjs/types'
import PropertyPathParser from './grammar/PropertyPathParser.js'
import PropertyPathLexer from './grammar/PropertyPathLexer.js'
import Visitor from './Visitor.js'

const visitor = new Visitor()

interface SparqlPathParser {
  (path: string): ShaclPropertyPath
  toAlgebra: (path: string) => PropertyPath | NamedNode
}

export const parse = function (path: string): ShaclPropertyPath {
  const chars = new antlr4.CharStream(path)
  const lexer = new PropertyPathLexer(chars)
  const tokens = new antlr4.CommonTokenStream(lexer)
  const parser = new PropertyPathParser(tokens)

  // remove default console error listener
  parser.removeErrorListeners()
  parser.addErrorListener({
    syntaxError: (recognizer, offendingSymbol, line, column, msg, e) => {
      throw new Error(msg)
    },
  })

  return parser.path().accept(visitor)
} as SparqlPathParser

parse.toAlgebra = (pathStr) => toAlgebra(parse(pathStr))
