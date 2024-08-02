import parent, { Environment } from '@zazuko/env-node'
import { KopflosNamespaceFactory } from './KopflosNamespaceFactory.js'
import { CodeLoadersFactory } from './CodeLoadersFactory.js'

const env = new Environment([
  KopflosNamespaceFactory,
  CodeLoadersFactory,
], { parent })

export default env
export type KopflosEnvironment = typeof env
