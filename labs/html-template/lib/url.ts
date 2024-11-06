import { expand } from '@zazuko/prefixes'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type { DataFactory } from '@rdfjs/types'
import type { NamespaceBuilder } from '@rdfjs/namespace'

export function toNamedNode(env: Environment<DataFactory>, ns: NamespaceBuilder, url: string) {
  if (/^(urn:|https?:\/\/)/.test(url)) {
    return env.namedNode(url)
  }
  const expanded = expand(url)
  if (expanded) {
    return env.namedNode(expanded)
  }

  return ns(url)
}
