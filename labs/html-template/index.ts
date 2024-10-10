import type { Handler, KopflosEnvironment } from '@kopflos-cms/core'
import log from '@kopflos-cms/logger'
import { parseDocument } from 'htmlparser2'
import type { CheerioAPI, Cheerio } from 'cheerio'
import { load } from 'cheerio'
import type { AnyNode } from 'domhandler'
import type { AnyPointer, MultiPointer } from 'clownface'
import { expand } from '@zazuko/prefixes'

interface TemplateFunc {
  (template: string, graph: MultiPointer): string
}

export default function bindTemplate(evaluateTemplate: TemplateFunc, resourcePath: string): Handler {
  return async ({ env }, response) => {
    const dataset = await env.sparql.default.parsed.query.construct(`
BASE <${env.kopflos.config.baseIri}>
DESCRIBE <${resourcePath}>`)
    const graph = env.clownface({ dataset })

    const dom = parseDocument(response!.body as string)
    const $ = load(dom)
    replaceTemplates($, env, evaluateTemplate)($('html > * > template'), graph)

    return {
      ...response!,
      body: $.html(),
    }
  }
}

function replaceTemplates($: CheerioAPI, env: KopflosEnvironment, evaluateTemplate: TemplateFunc) {
  const ns = env.namespace(env.kopflos.config.baseIri)

  return function doReplace(templates: Cheerio<AnyNode>, graph: AnyPointer, level = 0) {
    templates.each((_, template) => {
      const $template = $(template)

      let pointer: MultiPointer
      const attr = $template.attr() || {}
      if (attr['target-class']) {
        const classIri = ns(attr['target-class'])
        pointer = graph.any().has(env.ns.rdf.type, classIri)
      } else if (attr.property) {
        const property = env.namedNode(expand(attr.property))
        pointer = graph.out(property)
      } else {
        log.warn('Unrecognized template', attr)
        return
      }

      doReplace($template.find('* > template'), pointer, level + 1)
      $template.replaceWith(evaluateTemplate($template.html()!, pointer))
    })
  }
}
