import { toRdf } from 'rdf-literal'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'

export function isReadable(env: Environment<NsBuildersFactory>, collection: GraphPointer) {
  return !collection.has(env.ns.hydra.readable, toRdf(false)).term
}
