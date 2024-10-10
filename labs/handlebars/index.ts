import type { MultiPointer } from 'clownface'
import hbs from 'handlebars'
import './lib/helpers.js'

export default function (template: string, pointer: MultiPointer): string {
  const compiled = hbs.compile(template)
  return compiled(pointer, {
    allowProtoPropertiesByDefault: true,
  })
}
