import type { GraphPointer } from 'clownface'
import type { KopflosEnvironment } from '@kopflos-cms/core'
import { toRdf } from 'rdf-literal'

export function hasHandler(env: KopflosEnvironment, shape: GraphPointer, method: string): boolean {
  const methods = shape.out(env.ns.kopflos.handler).out(env.ns.kopflos.method).values

  return methods.some(m => m.toUpperCase() === method.toUpperCase())
}

export function isReadOnly(env: KopflosEnvironment, shape: GraphPointer): boolean {
  return shape.out(env.ns.dash.readOnly, toRdf(true)).terms.length > 0
}
