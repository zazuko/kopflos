import Processor from '@hydrofoil/sparql-processor'
import type * as sparqljs from 'sparqljs'
import type { DataFactory } from '@rdfjs/types'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import { pageUrlFunction } from './pageUrl.js'
import { logger } from './logger.js'
import BindExpressionProcessor, { isPageUrlCall } from './BindExpressionProcessor.js'

type E = Environment<NsBuildersFactory | Required<DataFactory>>

export default class SparqlProcessor extends Processor<E> {
  // Select local Comunica evaluation only for queries containing pageUrl.
  // Queries without it continue through the configured endpoint client.
  public usesPageUrl = false

  processPatterns(patterns: sparqljs.Pattern[]): sparqljs.Pattern[] {
    return patterns.flatMap((pattern) => {
      if (pattern.type === 'bind') {
        return this.pageUrlBindings(pattern)
      }
      return this.processPattern(pattern)
    })
  }

  private pageUrlBindings(bind: sparqljs.BindPattern): sparqljs.BindPattern[] {
    const processor = new BindExpressionProcessor(this.factory, this.processPatterns.bind(this))
    const expression = processor.processExpression(bind.expression)
    this.usesPageUrl ||= processor.bindings.length > 0
    return [...processor.bindings, { ...bind, expression }]
  }

  processFunctionCall(call: sparqljs.FunctionCallExpression): sparqljs.Expression {
    if (isPageUrlCall(call)) {
      throw new Error('Use kopflos:pageUrl within a BIND expression in WHERE')
    }
    return super.processFunctionCall(call)
  }

  processSubquery(query: sparqljs.SelectQuery) {
    const processor = new SparqlProcessor(this.factory)
    const result = processor.processQuery(query)
    this.usesPageUrl ||= processor.usesPageUrl
    return result
  }

  processService(service: sparqljs.ServicePattern) {
    if (service.name.value === 'https://kopflos.described.at/Pages') {
      logger.warn('SERVICE kopflos:Pages is deprecated. Use BIND(kopflos:pageUrl(?resource, relationship) AS ?page) instead. The SERVICE syntax will be removed in a future breaking release (https://github.com/zazuko/kopflos/issues/378).')
      const patterns = service.patterns
        .filter(p => p.type === 'bgp')
        .flatMap(p => p.triples.flatMap((triple) => {
          if (triple.object.termType !== 'Variable' || 'pathType' in triple.predicate || (triple.subject.termType !== 'Variable' && triple.subject.termType !== 'NamedNode')) {
            throw new Error('Deprecated SERVICE kopflos:Pages requires a variable object and a simple relationship')
          }
          const call: sparqljs.FunctionCallExpression = {
            type: 'functionCall',
            function: this.factory.namedNode(pageUrlFunction),
            args: [triple.subject, triple.predicate],
          }
          return this.pageUrlBindings({ type: 'bind', variable: triple.object, expression: call })
        }))
      if (!patterns.length) {
        logger.warn('No supported triple patterns found in SERVICE kopflos:Pages')
      }
      return patterns
    }

    return super.processService(service)
  }
}
