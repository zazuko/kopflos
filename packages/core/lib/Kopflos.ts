import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'node:http'
import type { DatasetCore, NamedNode, Stream } from '@rdfjs/types'
import type { AnyPointer, GraphPointer, MultiPointer } from 'clownface'
import env from './env/index.js'

interface KopflosRequest {
  iri: NamedNode
  headers: IncomingHttpHeaders
}

type ResultBody = Stream | DatasetCore | GraphPointer | Error | string | object
type ResultEnvelope = {
  body: ResultBody
  headers?: OutgoingHttpHeaders
}
export type KopflosResponse = ResultBody | ResultEnvelope

export class Kopflos {
  declare apis: MultiPointer

  constructor(graph: AnyPointer) {
    this.apis = graph.any().has(env.ns.rdf.type, env.ns.kopflos.Api)
  }

  async handleRequest(req: KopflosRequest): Promise<KopflosResponse> {
    return {
      body: `Hello, <${req.iri.value}>!`,
    }
  }
}
