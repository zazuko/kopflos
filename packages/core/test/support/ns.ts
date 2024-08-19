import rdf from '@zazuko/env-node'
import type { NamespaceBuilder } from '@rdfjs/namespace'
import type { KopflosTerms } from '../../lib/env/KopflosNamespaceFactory.js'

export const ex = rdf.namespace('http://example.org/')
export const kopflos: NamespaceBuilder<KopflosTerms> = rdf.namespace('https://kopflos.described.at/')
