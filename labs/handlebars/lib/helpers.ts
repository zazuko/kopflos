import type { ShaclPropertyPath } from 'clownface-shacl-path'
import { findNodes } from 'clownface-shacl-path'
import { parse } from 'sparql-path-parser'
import type { TemplateContext } from '@kopflos-labs/html-template'

export const valueof = () => {
  const cache = new Map<string, ShaclPropertyPath>()

  return function (this: TemplateContext, property: string = '') {
    let propertyPath = cache.get(property)
    if (!propertyPath) {
      propertyPath = parse(property)
      cache.set(property, propertyPath)
    }
    if (!propertyPath) {
      return ''
    }

    return findNodes(this.pointer, propertyPath).value
  }
}
