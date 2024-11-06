import hbs from 'handlebars'
import type { TemplateFunc } from '@kopflos-labs/html-template'
import { valueof } from './lib/helpers.js'

const processTemplate: TemplateFunc = function (template, context, env): string {
  const compiled = hbs.compile(template)
  return compiled(context, {
    helpers: {
      valueof: valueof(env.kopflos.config.baseIri),
    },
    allowedProtoProperties: {
      value: true,
    },
  })
}

export default processTemplate
