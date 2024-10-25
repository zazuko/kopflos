import type { Cheerio, CheerioAPI } from 'cheerio'
import type { KopflosEnvironment } from '@kopflos-cms/core'
import type { AnyNode } from 'domhandler'
import type { AnyPointer, MultiPointer } from 'clownface'
import log from '@kopflos-cms/logger'
import type { TemplateFunc } from '../index.js'
import * as url from './url.js'

export function replaceTemplates($: CheerioAPI, env: KopflosEnvironment, evaluateTemplate: TemplateFunc) {
  const ns = env.namespace(env.kopflos.config.baseIri)

  const toNamedNode = url.toNamedNode.bind(null, env, ns)

  return function doReplace(graph: AnyPointer, templates: Cheerio<AnyNode> = $('html > * > template'), level = 0) {
    templates.each((_, template) => {
      const $template = $(template)

      let pointers: MultiPointer
      const attr = $template.attr() || {}
      if (attr['target-class']) {
        const classIri = toNamedNode(attr['target-class'])
        pointers = graph.any().has(env.ns.rdf.type, classIri)
      } else if (attr.property) {
        const property = toNamedNode(attr.property)
        pointers = graph.out(property)
      } else {
        log.warn('Unrecognized template', attr)
        return
      }

      pointers.forEach(pointer => {
        doReplace(pointer, $template.find('* > template'), level + 1)
      })
      $template.replaceWith(pointers.map(pointer => evaluateTemplate($template.html()!, { pointer })).join(''))
    })
  }
}
