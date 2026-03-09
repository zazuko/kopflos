import { render } from '@lit-labs/ssr'
import type { RenderInfo } from '@lit-labs/ssr/lib/render-value.js'
import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { getWindow } from '@lit-labs/ssr/lib/dom-shim.js'
import { load } from 'cheerio'
import Serializer from '@rdfjs/serializer-rdfjs'
import * as esbuild from 'esbuild'
import { setLanguages } from '@rdfjs-elements/lit-helpers'
import type { Term } from '@rdfjs/types'
import type { AnyPointer } from 'clownface'
import type { ExecuteConstruct } from 'sparqlc'
import type { HandlerArgs, KopflosConfig } from '@kopflos-cms/core'
import TermMap from '@rdfjs/term-map'
import { expand } from '@zazuko/prefixes'
import { createLogger } from '@kopflos-cms/logger'
import selectPagePatterns from '../queries/page-patterns.rq'
import SparqlProcessor from './SparqlProcessor.js'
import PageUrlTransform from './PageUrlTransform.js'
import { fillTemplate } from './pageParameters.js'
import type { Page, QueryMap } from '@kopflos-labs/pages'

const log = createLogger('ssr')

export type SsrOptions = Parameters<typeof render>[1] & {
  disallowConnectedCallback?: Array<RegExp | string>
  allowConnectedCallback?: Array<RegExp | string>
}

interface SsrModule {
  (arg: {
    kopflos: KopflosConfig
    req: HandlerArgs
    html: string
    options: SsrOptions
    page: Page
  }): Promise<string>
}

const serializer = new Serializer();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).window = getWindow({
  includeJSBuiltIns: true,
})

type RendererData = NonNullable<Page['data']>
type ParamMapEntry = [Term, Term | Term[]]

async function executeQueries(renderer: Page, queries: QueryMap, { env, subjectVariables, query: queryParams }: HandlerArgs): Promise<RendererData> {
  const data: RendererData = renderer.data || {}

  const pagePatterns = await selectPagePatterns({ env, client: env.sparql.default.parsed })

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

    if (renderer.parameters) {
      for (const [key, pattern] of Object.entries(renderer.parameters)) {
        const keyTerm = expand(key) ? env.namedNode(expand(key)) : env.literal(key)

        if (params.has(keyTerm)) continue

        const bound = fillTemplate(pattern, subjectVariables)

        if (bound) {
          params.set(keyTerm, env.literal(bound))
        }
      }
    }

    if (renderer.mainEntity) {
      const mainEntity = fillTemplate(renderer.mainEntity, subjectVariables)
      if (mainEntity) {
        params.set(env.ns.schema.mainEntity, mainEntity.startsWith('http') ? env.namedNode(mainEntity) : env.kopflos.appNs(mainEntity))
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

const ssr: SsrModule = async ({ kopflos, page, html, req, options: ssrOptions = {} }) => {
  const { head, body } = page
  const queries: QueryMap = page.queries || {}

  const data = await executeQueries(page, queries, req)

  setLanguages(...req.headers['accept-language'] || [])

  const $ = load(html)

  if (head) {
    $('head').append(await (typeof head === 'function' ? head({ ...req, data: data as Record<string, AnyPointer> }) : head))
  }

  const { Renderer, usedData } = prepareRenderer(data, ssrOptions)
  $('body').prepend(await collectResult(render(await body({ ...req, data }), {
    ...ssrOptions,
    elementRenderers: [
      ...ssrOptions.elementRenderers || [],
      Renderer,
    ],
  })))

  if (usedData.size) {
    let script = [
      'window.graphs = window.graphs || {};',
      ...[...usedData].map((name) => {
        const datasetOrPointer = data[name]
        const dataset = 'terms' in datasetOrPointer ? (datasetOrPointer as AnyPointer).dataset : datasetOrPointer
        return serializer.transform(dataset).replace('export default', `window.graphs.${name} =`)
      }),
    ].join('\n')

    if (kopflos.mode === 'production') {
      script = (await esbuild.transform(script, {
        minify: true,
        target: 'esnext',
      })).code
    }
    $('head').prepend(`<script type="module">${script}</script>`)
  }

  return $.html({
    xml: {
      xmlMode: false,
    },
  })
}

function ensureCaseInsensitiveRegex(regex: RegExp | string) {
  if (regex instanceof RegExp) {
    return new RegExp(regex.source, [...new Set(['i', ...regex.flags])].join(''))
  }
  return new RegExp(`^${regex}$`, 'i')
}

function prepareRenderer(data: RendererData, options: SsrOptions) {
  const usedData: Set<string> = new Set()

  const allowConnectedCallback = (options.allowConnectedCallback || []).map(ensureCaseInsensitiveRegex)
  const disallowConnectedCallback = (options.disallowConnectedCallback || []).map(ensureCaseInsensitiveRegex)

  class Renderer extends LitElementRenderer {
    connectedCallback(): void {
      if (this.element?.hasAttribute('data-graph')) {
        const value = this.element.getAttribute('data-graph')!
        usedData.add(value)
        this.setProperty('graph', data[value])
      }

      const connectedCallbackAllowed = allowConnectedCallback.length === 0 || allowConnectedCallback.some((regex) => regex.test(this.element.tagName))
      const connectedCallbackDisallowed = disallowConnectedCallback.length > 0 && disallowConnectedCallback.some((regex) => regex.test(this.element.tagName))

      if (connectedCallbackAllowed && !connectedCallbackDisallowed) {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this.element.enableUpdating = function () { }
          this.element.connectedCallback()
        } catch (e: unknown) {
          log.warn(`Error in connectedCallback for element ${this.element.tagName}`)
          log.debug(e)
        }
      }

      return super.connectedCallback()
    }

    * renderShadow(ri: RenderInfo) {
      const shadow = super.renderShadow(ri)

      yield '<open-styles></open-styles>'
      yield * shadow
    }
  }

  return {
    Renderer,
    usedData,
  }
}

export default ssr
