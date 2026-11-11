import { randomUUID } from 'node:crypto'
import Processor from '@hydrofoil/sparql-processor'
import type { DataFactory } from '@rdfjs/types'
import type * as sparqljs from 'sparqljs'
import { pageUrlFunction } from './pageUrl.js'

export function isPageUrlCall(expression: sparqljs.Expression): expression is sparqljs.FunctionCallExpression {
  return 'type' in expression && expression.type === 'functionCall'
    && typeof expression.function !== 'string' && expression.function.value === pageUrlFunction
}

// Each instance owns one BIND's collector. Recursive argument processing emits
// inner calls before the calls that depend on them.
export default class BindExpressionProcessor<F extends Required<DataFactory>> extends Processor<F> {
  public readonly bindings: sparqljs.BindPattern[] = []

  constructor(factory: F, private readonly processGraphPatterns: (patterns: sparqljs.Pattern[]) => sparqljs.Pattern[]) {
    super(factory)
  }

  processFunctionCall(call: sparqljs.FunctionCallExpression): sparqljs.Expression {
    const expression = super.processFunctionCall(call)
    if (!isPageUrlCall(call)) return expression

    const variable = this.factory.variable(`__kopflos_pageUrl_${randomUUID().replaceAll('-', '')}`)
    // Separate BINDs keep extension evaluation local to Comunica. IRI turns
    // failure sentinels, including invalid arity, into expression errors.
    this.bindings.push({ type: 'bind', expression, variable })
    return { type: 'operation', operator: 'iri', args: [variable] }
  }

  processPatterns(patterns: sparqljs.Pattern[]): sparqljs.Pattern[] {
    // Graph expressions contain independent BIND scopes.
    return this.processGraphPatterns(patterns)
  }

  protected clone() {
    return new BindExpressionProcessor(this.factory, this.processGraphPatterns)
  }
}
