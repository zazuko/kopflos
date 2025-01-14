import type { ParsedUrlQuery } from 'node:querystring'
import { hydra } from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type { DataFactory, NamedNode } from '@rdfjs/types'
import type ClownfaceFactory from 'clownface/Factory.js'

const literalValueRegex = /^"(?<value>.+)"(@|\^\^)?((?<=@)(?<language>.*))?((?<=\^\^)(?<datatype>.*))?$/

function createTermFromVariable(rdf: Environment<DataFactory>, template: GraphPointer, value: string | string[]) {
  if (!hydra.ExplicitRepresentation.equals(template.out(hydra.variableRepresentation).term)) {
    return value
  }

  const parseValue = (value: string) => {
    const matches = value.match(literalValueRegex)
    if (matches?.groups) {
      let datatypeOrLanguage: NamedNode | string | undefined = matches.groups?.language
      if (matches.groups?.datatype) {
        datatypeOrLanguage = rdf.namedNode(matches.groups.datatype)
      }

      return rdf.literal(matches.groups.value, datatypeOrLanguage)
    }

    return rdf.namedNode(value)
  }

  const values = Array.isArray(value) ? value : value.split(',')
  return values.map(parseValue)
}

export function fromQuery(rdf: Environment<DataFactory | ClownfaceFactory>, query: ParsedUrlQuery, template: GraphPointer) {
  const templateParams = rdf.clownface().blankNode()
  const variablePropertyMap = new Map()

  template.out(hydra.mapping).forEach(mapping => {
    const variable = mapping.out(hydra.variable).value
    const property = mapping.out(hydra.property).term

    variablePropertyMap.set(variable, property)
  })

  Object.entries(query).forEach(([key, value]) => {
    const property = variablePropertyMap.get(key)

    if (!property || !value) {
      return
    }

    templateParams.addOut(property, createTermFromVariable(rdf, template, value))
  })

  return templateParams
}

export function applyTemplate(resource: GraphPointer, expanded: string) {
  let url = new URL(resource.value)

  if (expanded.startsWith('?') || expanded.startsWith('$')) {
    const searchParams = new URLSearchParams(expanded)
    for (const [param, value] of searchParams) {
      url.searchParams.append(param, value)
    }
  } else {
    url = new URL(expanded, url)
  }

  return url.toString()
}
