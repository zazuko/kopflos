import { render } from '@lit-labs/ssr'
import type { RenderInfo } from '@lit-labs/ssr/lib/render-value.js'
import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { getWindow } from '@lit-labs/ssr/lib/dom-shim.js'
import { load } from 'cheerio'
import Serializer from '@rdfjs/serializer-rdfjs'
import * as esbuild from 'esbuild'
import { setLanguages } from '@rdfjs-elements/lit-helpers'
import type { AnyPointer } from 'clownface'
import type { HandlerArgs, KopflosConfig } from '@kopflos-cms/core'
import { createLogger } from '@kopflos-cms/logger'
import selectPagePatterns from '../queries/page-patterns.rq'
import type { PageData, QueryMap } from './pageData.js'
import { executeQuery } from './pageData.js'
import type { Page } from '@kopflos-labs/pages'

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

const ssr: SsrModule = async ({ kopflos, page, html, req, options: ssrOptions = {} }) => {
  const { head, body } = page
  const { env } = req

  const pagePatterns = await selectPagePatterns({ env, client: env.sparql.default.parsed })

  const pendingQueries = Object.entries(page.queries as unknown as QueryMap).map(async ([key, query]) => {
    const start = performance.now()
    const result = await executeQuery({
      ...page,
      query,
      pagePatterns,
      env,
      subjectVariables: req.subjectVariables,
      queryParams: req.query,
    })
    const end = performance.now()
    log.info(`Page query ${key} took ${Math.round(end - start)}ms`)

    return [key, result] as const
  })

  const results = await Promise.all(pendingQueries)
  const data = Object.fromEntries(results)

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

function prepareRenderer(data: PageData, options: SsrOptions) {
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
