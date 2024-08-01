import parent, { Environment } from '@zazuko/env-node'
import { KopflosNamespaceFactory } from './KopflosNamespaceFactory.js'

export default new Environment([KopflosNamespaceFactory], { parent })
