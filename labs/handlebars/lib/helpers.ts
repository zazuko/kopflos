import type { GraphPointer, MultiPointer } from 'clownface'
import type { NamedNode } from '@rdfjs/types'
import $rdf from '@zazuko/env'
import { expand } from '@zazuko/prefixes'
import { findNodes } from 'clownface-shacl-path'
import hbs from 'handlebars'

hbs.registerHelper('valueof', function (this: MultiPointer, property: string = '') {
  let propertyPath: GraphPointer | NamedNode | undefined
  const [first, ...rest] = property.split('/').map(prop => $rdf.namedNode(expand(prop.trim())))
  if (rest.length === 0) {
    propertyPath = first
  } else if (rest.length > 0) {
    propertyPath = this.blankNode()
    propertyPath.addOut($rdf.ns.rdf.first, first)
    propertyPath.addList($rdf.ns.rdf.rest, rest)
  }

  if (!propertyPath) {
    return ''
  }

  return findNodes(this, propertyPath).value
})
