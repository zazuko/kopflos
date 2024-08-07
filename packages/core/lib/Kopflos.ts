import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'node:http'
import type { DatasetCore, NamedNode, Stream } from '@rdfjs/types'
import type { AnyPointer, GraphPointer, MultiPointer } from 'clownface'
import type { Options as EndpointOptions, StreamClient } from 'sparql-http-client/StreamClient.js'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { KopflosEnvironment } from './env/index.js'
import { createEnv } from './env/index.js'
import type { ResourceShapeLookup, ResourceShapeMatch } from './resourceShape.js'
import defaultResourceShapeLookup from './resourceShape.js'
import { responseOr } from './responseOr.js'
import type { ResourceLoader, ResourceLoaderLookup } from './resourceLoader.js'
import { findResourceLoader } from './resourceLoader.js'
import type { Handler, HandlerLookup } from './handler.js'
import { loadHandler } from './handler.js'

interface KopflosRequest {
  iri: NamedNode
  headers: IncomingHttpHeaders
}

type ResultBody = Stream | DatasetCore | GraphPointer | Error
type ResultEnvelope = {
  body?: ResultBody | string
  status?: number
  headers?: OutgoingHttpHeaders
}
export type KopflosResponse = ResultBody | ResultEnvelope

export interface Kopflos {
  get env(): KopflosEnvironment
  get apis(): MultiPointer
  handleRequest(req: KopflosRequest): Promise<KopflosResponse>
}

interface Clients {
  stream: StreamClient
  parsed: ParsingClient
}

type Endpoint = string | EndpointOptions | Clients

export interface KopflosConfig {
  sparql: Record<string, Endpoint> & { default: Endpoint }
}

interface Options {
  resourceShapeLookup?: ResourceShapeLookup
  resourceLoaderLookup?: ResourceLoaderLookup
  handlerLookup?: HandlerLookup
}

export default class implements Kopflos {
  readonly apis: MultiPointer
  readonly env: KopflosEnvironment

  constructor(private graph: AnyPointer, private readonly config: KopflosConfig, private readonly options: Options = {}) {
    this.env = createEnv(config)

    this.apis = graph.any().has(this.env.ns.rdf.type, this.env.ns.kopflos.Api)
  }

  async handleRequest(req: KopflosRequest): Promise<KopflosResponse> {
    return responseOr(this.findResourceShape(req.iri), (resourceShapeMatch: ResourceShapeMatch) => {
      const resourceShape = this.graph.node(resourceShapeMatch.resourceShape)

      return responseOr(this.findResourceLoader(resourceShape), loader => {
        return responseOr(this.loadResource(req.iri, loader), resourceGraph => {
          let root: GraphPointer | undefined
          if ('subject' in resourceShapeMatch) {
            root = resourceGraph.node(resourceShapeMatch.subject)
          }

          return responseOr(this.loadHandler(resourceShapeMatch), handler => {
            return handler({
              resourceShape,
              env: this.env,
              resource: resourceGraph.node(req.iri),
              root,
            })
          })
        })
      })
    })
  }

  async findResourceShape(iri: NamedNode): Promise<ResourceShapeMatch | KopflosResponse> {
    const resourceShapeLookup = this.options.resourceShapeLookup || defaultResourceShapeLookup

    return responseOr(resourceShapeLookup(iri, this), async candidates => {
      if (candidates.length === 0) {
        return { status: 404 }
      }

      if (candidates.length > 1) {
        return new Error('Multiple resource shapes found')
      }

      return candidates[0]
    })
  }

  async findResourceLoader(resourceShape: GraphPointer): Promise<ResourceLoader | KopflosResponse> {
    const resourceLoaderLookup = this.options.resourceLoaderLookup || findResourceLoader

    const loader = await resourceLoaderLookup(resourceShape, this.env)

    return loader || new Error('No loader found')
  }

  async loadResource(iri: NamedNode, loader: ResourceLoader): Promise<AnyPointer> {
    const stream = loader(iri, { env: this.env })
    const dataset = await this.env.dataset().import(stream)
    return this.env.clownface({ dataset })
  }

  async loadHandler(resourceShapeMatch: ResourceShapeMatch): Promise<Handler | KopflosResponse> {
    const handlerLookup = this.options.handlerLookup || loadHandler

    const handler = await handlerLookup(resourceShapeMatch, this)

    return handler || {
      status: 405,
    }
  }
}
