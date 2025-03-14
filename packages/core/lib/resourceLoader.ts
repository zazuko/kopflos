import type { AnyPointer, GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import type { NamedNode, Stream } from '@rdfjs/types'
import type { KopflosEnvironment } from './env/index.js'
import type { Kopflos } from './Kopflos.js'
import { logCode } from './log.js'

export interface ResourceLoader {
  (iri: NamedNode, instance: Kopflos): Stream
}

export interface ResourceLoaderLookup {
  (resourceShape: GraphPointer, env: KopflosEnvironment): Promise<ResourceLoader | undefined>
}

export async function findResourceLoader(resourceShape: GraphPointer, env: KopflosEnvironment): Promise<ResourceLoader | undefined> {
  let resourceLoader: AnyPointer

  resourceLoader = resourceShape
    .out(env.ns.kopflos.resourceLoader)

  if (!isGraphPointer(resourceLoader)) {
    const api = resourceShape.out(env.ns.kopflos.api)
    resourceLoader = api
      .out(env.ns.kopflos.resourceLoader)

    if (!isGraphPointer(resourceLoader)) {
      resourceLoader = api
        .out(env.ns.kopflos.config)
        .out(env.ns.kopflos.resourceLoader)
    }
  }

  logCode(resourceLoader, 'resource loader')
  return env.load<ResourceLoader>(resourceLoader)
}

export const describe: ResourceLoader = (iri, { env }) => {
  return env.sparql.default.stream.query.construct(`DESCRIBE <${iri.value}>`)
}

export const fromOwnGraph: ResourceLoader = (iri, { env }) => {
  return env.sparql.default.stream.query.construct(`CONSTRUCT { ?s ?p ?o } WHERE { GRAPH <${iri.value}> { ?s ?p ?o } }`)
}
