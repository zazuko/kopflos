import Processor from '@hydrofoil/sparql-processor'
import type * as sparqljs from 'sparqljs'
import type { Variable } from '@rdfjs/types'
import type { KopflosEnvironment } from '@kopflos-cms/core'
import { toRdf } from 'rdf-literal'
import type { Bindings } from '../queries/page-patterns.rq'

export default class extends Processor<KopflosEnvironment> {
  constructor(factory: KopflosEnvironment, private pages: Bindings[]) {
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
