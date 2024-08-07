import parent, { Environment } from '@zazuko/env-node'
import type { KopflosConfig } from '../Kopflos.js'
import { KopflosNamespaceFactory } from './KopflosNamespaceFactory.js'
import { CodeLoadersFactory } from './CodeLoadersFactory.js'
import SparqlClientFactory from './SparqlClientFactory.js'

export function createEnv({ sparql }: KopflosConfig) {
  return new Environment([
    KopflosNamespaceFactory,
    SparqlClientFactory(sparql),
    CodeLoadersFactory,
  ], { parent })
}

export type KopflosEnvironment = ReturnType<typeof createEnv>
