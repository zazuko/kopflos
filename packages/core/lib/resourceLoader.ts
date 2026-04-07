import type { AnyPointer, GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'
import type { Stream } from '@rdfjs/types'
import type { KopflosEnvironment } from './env/index.js'
import type { Kopflos } from './Kopflos.js'
import { logCode } from './log.js'
import type { ResourceShapeMatch } from './resourceShape.js'

export interface ResourceLoader {
  (match: ResourceShapeMatch, instance: Kopflos, endpoint?: string): Stream
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

export const describe: ResourceLoader = ({ subject, endpoint = 'default' }, { env }) => {
  return env.sparql[endpoint].stream.query.construct(`DESCRIBE <${subject.value}>`)
}

export const fromOwnGraph: ResourceLoader = ({ subject, endpoint = 'default' }, { env }) => {
  return env.sparql[endpoint].stream.query.construct(`CONSTRUCT { ?s ?p ?o } WHERE { GRAPH <${subject.value}> { ?s ?p ?o } }`)
}
