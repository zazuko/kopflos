import Processor from '@hydrofoil/sparql-processor'
import type * as sparqljs from 'sparqljs'
import type { DataFactory, Variable } from '@rdfjs/types'
import { toRdf } from 'rdf-literal'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type { Bindings } from '../queries/page-patterns.rq'

type E = Environment<NsBuildersFactory | Required<DataFactory>>

export default class extends Processor<E> {
  constructor(factory: E, private pages: Bindings[]) {
    super(factory)
  }

  processService(service: sparqljs.ServicePattern): sparqljs.Pattern {
    if (service.name.value === 'https://kopflos.described.at/Pages') {
      const resourceVariable = service.patterns
        .find(p => p.type === 'bgp')
        ?.triples
        .find(t => t.subject.termType === 'Variable' && 'termType' in t.predicate && this.factory.ns.schema.mainEntityOfPage.equals(t.predicate))
        ?.subject as Variable

      if (!resourceVariable) {
        throw new Error('No mainEntity variable found in service pattern')
      }

      return <sparqljs.GroupPattern>{
        type: 'group',
        patterns: [
          <sparqljs.ValuesPattern>{
            type: 'values',
            values: this.pages.map(({ resourcePattern, pagePattern }) => ({
              '?resourcePattern': resourcePattern,
              '?pagePattern': pagePattern,
            })),
          },
          <sparqljs.BindPattern>{
            type: 'bind',
            variable: this.factory.variable('page'),
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
                    this.factory.variable('resourcePattern'),
                  ],
                },
                this.factory.variable('pagePattern'),
                {
                  type: 'operation',
                  operator: '/',
                  args: [toRdf(1), toRdf(0)],
                },
              ],
            },
          },
        ],
      }
    }

    return super.processService(service)
  }
}
