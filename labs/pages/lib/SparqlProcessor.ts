import Processor from '@hydrofoil/sparql-processor'
import type * as sparqljs from 'sparqljs'
import type { DataFactory, Term, Variable } from '@rdfjs/types'
import { toRdf } from 'rdf-literal'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type { Bindings } from '../queries/page-patterns.rq'
import { logger } from './logger.js'

type E = Environment<NsBuildersFactory | Required<DataFactory>>

export default class extends Processor<E> {
  constructor(factory: E, private pages: Bindings[]) {
    super(factory)
  }

  processService(service: sparqljs.ServicePattern) {
    if (service.name.value === 'https://kopflos.described.at/Pages') {
      const patterns = service.patterns
        .filter(p => p.type === 'bgp')
        .flatMap(p => p.triples.flatMap(triple => this.toPagePatterns(triple)))

      if (!patterns.length) {
        logger.warn('No supported triples patterns found in `SERVICE kopflos:Pages`')
      }

      return patterns
    }

    return super.processService(service)
  }

  toPagePatterns(triple: sparqljs.Triple): sparqljs.Pattern | sparqljs.Pattern[] {
    const resourceVariable = triple.subject as Variable
    const pageVariable = triple.object.termType === 'Variable' ? triple.object as Variable : this.factory.variable('page')
    const predicate = triple.predicate as Term

    const matchingPages = this.pages.filter((page) => {
      if (!page.path) {
        return true
      }
      if (predicate.equals(this.factory.ns.schema.mainEntityOfPage) || predicate.equals(this.factory.ns.schema.mainEntity)) {
        return page.path.equals(this.factory.ns.schema.mainEntityOfPage) || page.path.equals(this.factory.ns.schema.mainEntity)
      }
      return page.path.equals(predicate)
    })

    const resourcePatternVar = this.factory.variable(`resourcePattern_${resourceVariable.value}`)
    const pagePatternVar = this.factory.variable(`pagePattern_${resourceVariable.value}`)

    return [
      <sparqljs.ValuesPattern>{
        type: 'values',
        values: matchingPages.map(({ resourcePattern, pagePattern }) => ({
          [`?${resourcePatternVar.value}`]: resourcePattern,
          [`?${pagePatternVar.value}`]: pagePattern,
        })),
      },
      <sparqljs.BindPattern>{
        type: 'bind',
        variable: pageVariable,
        expression: {
          type: 'operation',
          operator: 'if',
          args: [
            {
              type: 'operation',
              operator: 'regex',
              args: [
                {
                  type: 'operation',
                  operator: 'str',
                  args: [resourceVariable],
                },
                resourcePatternVar,
              ],
            },
            pagePatternVar,
            {
              type: 'operation',
              operator: '/',
              args: [toRdf(1), toRdf(0)],
            },
          ],
        },
      },
    ]
  }
}
