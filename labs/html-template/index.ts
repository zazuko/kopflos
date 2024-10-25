import type { Handler, HandlerArgs, KopflosEnvironment } from '@kopflos-cms/core'
import { parseDocument } from 'htmlparser2'
import { load } from 'cheerio'
import type { GraphPointer } from 'clownface'
import type { DatasetCore, Stream } from '@rdfjs/types'
import { replaceTemplates } from './lib/replaceTemplates.js'

export interface TemplateContext {
  pointer: GraphPointer
}

export interface TemplateFunc {
  (template: string, context: TemplateContext, env: KopflosEnvironment): string
}

export interface TemplateDataFunc {
  (context: HandlerArgs): Promise<DatasetCore> | DatasetCore | Stream
}

export default function bindTemplate<A extends unknown[] = unknown[]>(evaluateTemplate: TemplateFunc, fetchData?: (...args: A) => TemplateDataFunc, ...args: A): Handler {
  return async (context, response) => {
    if (typeof response?.body !== 'string') {
      return new Error('Template handler must be chained after another which returns a HTML response')
    }

    let dataset: DatasetCore | undefined

    if (fetchData) {
      const templateData = fetchData(...args)(context)
      if ('then' in templateData || 'size' in templateData) {
        dataset = await templateData
      } else {
        dataset = await context.env.dataset().import(templateData)
      }
    }
    const graph = context.env.clownface({ dataset })

    const dom = parseDocument(response.body)
    const $ = load(dom)
    replaceTemplates($, context.env, evaluateTemplate)(graph)

    return {
      ...response!,
      body: $.html(),
    }
  }
}
