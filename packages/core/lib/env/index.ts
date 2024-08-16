import parent, { Environment } from '@zazuko/env-node'
import type { KopflosConfig } from '../Kopflos.js'
import { KopflosNamespaceFactory } from './KopflosNamespaceFactory.js'
import { CodeLoadersFactory } from './CodeLoadersFactory.js'
import SparqlClientFactory from './SparqlClientFactory.js'
import KopflosFactory from './KopflosFactory.js'

export function createEnv(config: KopflosConfig) {
  return new Environment([
    KopflosFactory(config),
    KopflosNamespaceFactory,
    SparqlClientFactory,
    CodeLoadersFactory,
  ], { parent })
}

export type KopflosEnvironment = ReturnType<typeof createEnv>
