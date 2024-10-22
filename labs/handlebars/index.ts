import type { GraphPointer } from 'clownface'
import hbs from 'handlebars'
import type { TemplateFunc } from '@kopflos-labs/html-template'
import './lib/helpers.js'

const processTemplate: TemplateFunc = (template: string, pointer: GraphPointer): string => {
  const compiled = hbs.compile(template)
  return compiled(pointer, {
    allowProtoPropertiesByDefault: true,
  })
}

export default processTemplate
