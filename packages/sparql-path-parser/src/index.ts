import * as antlr4 from 'antlr4' // eslint-disable-line import/no-extraneous-dependencies
import type { ShaclPropertyPath } from 'clownface-shacl-path'
import { toAlgebra } from 'clownface-shacl-path'
import type { PropertyPath } from 'sparqljs'
import type { NamedNode } from '@rdfjs/types'
import PropertyPathParser from './grammar/PropertyPathParser.js'
import PropertyPathLexer from './grammar/PropertyPathLexer.js'
import Visitor from './Visitor.js'

interface Options {
  baseIRI?: string
}

interface SparqlPathParser {
  (path: string, opts?: Options): ShaclPropertyPath
  toAlgebra: (path: string, opts?: Options) => PropertyPath | NamedNode
}

export const parse = function (path: string, { baseIRI }: Options = {}): ShaclPropertyPath {
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

  return parser.path().accept(new Visitor(baseIRI))
} as SparqlPathParser

parse.toAlgebra = (pathStr) => toAlgebra(parse(pathStr))
