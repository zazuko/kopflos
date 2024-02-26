import { URL } from 'node:url'
import { resolve as resolvePath } from 'node:path'

export function isRelative(iri) {
  return !iri.match(/^[a-z]+:/)
}

export function resolve(baseIRI, relative) {
  const url = new URL(baseIRI)

  url.pathname = resolvePath(url.pathname, relative)

  return url.toString()
}
