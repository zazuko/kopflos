import type { HandlerArgs } from '@kopflos-cms/core'
import type { ExecuteConstruct } from 'sparqlc'
import TermMap from '@rdfjs/term-map'
import type { DataFactory, DatasetCore, Term } from '@rdfjs/types'
import { expand } from '@zazuko/prefixes'
import type { AnyPointer } from 'clownface'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type TermSetFactory from '@rdfjs/term-set/Factory.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type ClownfaceFactory from 'clownface/Factory.js'
import type { DatasetFactoryExt } from '@zazuko/env/lib/DatasetFactoryExt.js'
import type { KopflosFactory, SparqlClientFactory } from '@kopflos-cms/core/env.js'
import type { Bindings as PagePatternsRow } from '../queries/page-patterns.rq'
import SparqlProcessor from './SparqlProcessor.js'
import PageUrlTransform from './PageUrlTransform.js'
import { fillTemplate } from './pageParameters.js'

export type PageData = Record<string, AnyPointer | DatasetCore>

export interface QueryDescriptor {
  query: ExecuteConstruct
  endpoint?: string
}

export type QueryMap = Record<string, QueryDescriptor | ExecuteConstruct>

type ParamMapEntry = [Term, Term | Term[]]

interface Parameters {
  data?: PageData
  queries?: QueryMap
  parameters?: Record<string, string>
  mainEntity?: string
  env: Environment<Required<DataFactory> | DatasetFactoryExt | TermSetFactory | SparqlClientFactory | KopflosFactory | NsBuildersFactory | ClownfaceFactory>
  subjectVariables: HandlerArgs['subjectVariables']
  queryParams: HandlerArgs['query']
  pagePatterns: PagePatternsRow[]
}

export async function executeQueries({ data = {}, queries = {}, parameters, mainEntity, env, subjectVariables, queryParams, pagePatterns }: Parameters): Promise<PageData> {
  for (const [name, descriptor] of Object.entries(queries)) {
    const query: ExecuteConstruct = typeof descriptor === 'function' ? descriptor : descriptor.query
    const endpoint: string | undefined = typeof descriptor === 'object' ? descriptor.endpoint : undefined

    const client = endpoint ? env.sparql[endpoint].stream : env.sparql.default.stream

    const params: TermMap<Term, Term | Term[]> = new TermMap<Term, Term | Term[]>([
      ...Object.entries(subjectVariables).map<ParamMapEntry>(([key, value]) => [env.literal(key), env.literal(value)]),
      ...Object.entries(queryParams).reduce((acc, [key, value]): ParamMapEntry[] => {
        if (Array.isArray(value)) {
          return [...acc, [env.literal(key), value.map(v => env.literal(v.toString()))]]
        }
        if (!value) {
          return acc
        }
        return [...acc, [env.literal(key), env.literal(value.toString())]]
      }, []),
    ])

    if (parameters) {
      for (const [key, pattern] of Object.entries(parameters)) {
        const keyTerm = expand(key) ? env.namedNode(expand(key)) : env.literal(key)

        if (params.has(keyTerm)) continue

        const bound = fillTemplate(pattern, subjectVariables)

        if (bound) {
          params.set(keyTerm, env.literal(bound))
        }
      }
    }

    if (mainEntity) {
      const mainEntityFilled = fillTemplate(mainEntity, subjectVariables)
      if (mainEntityFilled) {
        const mainEntityNode = mainEntityFilled.startsWith('http')
          ? env.namedNode(mainEntityFilled)
          : env.kopflos.appNs(mainEntityFilled)
        params.set(env.ns.schema.mainEntity, mainEntityNode)
      }
    }

    const result = await query(params, {
      env,
      client,
      processors: [
        new SparqlProcessor(env, pagePatterns),
      ],
    })
    data[name] = env.clownface({
      dataset: await env.dataset().import(result.pipe(new PageUrlTransform(pagePatterns, env))),
    })
  }
  return data
}
