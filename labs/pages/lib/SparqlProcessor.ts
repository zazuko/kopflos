import { randomUUID } from 'node:crypto'
import Processor from '@hydrofoil/sparql-processor'
import type * as sparqljs from 'sparqljs'
import type { DataFactory } from '@rdfjs/types'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import { pageUrlFunction } from './pageUrl.js'
import { logger } from './logger.js'

type E = Environment<NsBuildersFactory | Required<DataFactory>>

export default class SparqlProcessor extends Processor<E> {
  // Select local Comunica evaluation only for queries containing pageUrl.
  // Queries without it continue through the configured endpoint client.
  public usesPageUrl = false
  private pendingBindings?: sparqljs.BindPattern[]

  processPattern(pattern: sparqljs.Pattern): sparqljs.Pattern | sparqljs.Pattern[] {
    const parent = this.pendingBindings
    this.pendingBindings = pattern.type === 'bind' || pattern.type === 'service' ? [] : undefined
    try {
      const processed = super.processPattern(pattern)
      return [...(this.pendingBindings || []), ...(Array.isArray(processed) ? processed : [processed])]
    }
    finally {
      this.pendingBindings = parent
    }
  }

  processFunctionCall(call: sparqljs.FunctionCallExpression): sparqljs.Expression {
    if (typeof call.function !== 'string' && call.function.value === pageUrlFunction) {
      if (call.args.length !== 2) {
        throw new Error('kopflos:pageUrl requires two arguments: resource and relationship')
      }
      if (!this.pendingBindings) {
        throw new Error('Use kopflos:pageUrl in a BIND within WHERE')
      }
      this.usesPageUrl = true
      const expression = super.processFunctionCall(call)
      const variable = this.factory.variable(`__kopflos_pageUrl_${randomUUID().replaceAll('-', '')}`)
      // Keep the extension as a separate BIND: Comunica 4 does not detect
      // nested extension functions reliably when deciding endpoint pushdown.
      this.pendingBindings.push({ type: 'bind', expression, variable })
      return { type: 'operation', operator: 'iri', args: [variable] }
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
        .flatMap(p => p.triples.map((triple): sparqljs.BindPattern => {
          if (triple.object.termType !== 'Variable' || 'pathType' in triple.predicate || (triple.subject.termType !== 'Variable' && triple.subject.termType !== 'NamedNode')) {
            throw new Error('Deprecated SERVICE kopflos:Pages requires a variable object and a simple relationship')
          }
          return {
            type: 'bind',
            variable: triple.object,
            expression: this.processFunctionCall({
              type: 'functionCall',
              function: this.factory.namedNode(pageUrlFunction),
              args: [triple.subject, triple.predicate],
            }),
          }
        }))
      if (!patterns.length) {
        logger.warn('No supported triple patterns found in SERVICE kopflos:Pages')
      }
      return patterns
    }

    return super.processService(service)
  }
}
