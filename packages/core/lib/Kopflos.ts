import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'node:http'
import type { DatasetCore, NamedNode, Stream } from '@rdfjs/types'
import type { GraphPointer, MultiPointer } from 'clownface'
import type { Options as EndpointOptions, StreamClient } from 'sparql-http-client/StreamClient.js'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import type { KopflosEnvironment } from './env/index.js'
import { createEnv } from './env/index.js'
import type { ResourceShapeLookup, ResourceShapeMatch } from './resourceShape.js'
import defaultResourceShapeLookup from './resourceShape.js'
import { responseOr } from './responseOr.js'
import type { ResourceLoader, ResourceLoaderLookup } from './resourceLoader.js'
import { insertShorthands, fromOwnGraph, findResourceLoader } from './resourceLoader.js'
import type { Handler, HandlerArgs, HandlerLookup } from './handler.js'
import { loadHandler } from './handler.js'
import type { HttpMethod } from './httpMethods.js'
import log from './log.js'

interface KopflosRequest {
  iri: NamedNode
  method: HttpMethod
  headers: IncomingHttpHeaders
}

type ResultBody = Stream | DatasetCore | GraphPointer | Error
export interface ResultEnvelope {
  body?: ResultBody | string
  status?: number
  headers?: OutgoingHttpHeaders
}
export type KopflosResponse = ResultBody | ResultEnvelope

export interface Kopflos {
  get env(): KopflosEnvironment
  get apis(): MultiPointer
  handleRequest(req: KopflosRequest): Promise<ResultEnvelope>
}

interface Clients {
  stream: StreamClient
  parsed: ParsingClient
}

type Endpoint = string | EndpointOptions | Clients

export interface KopflosConfig {
  sparql: Record<string, Endpoint> & { default: Endpoint }
  codeBase?: string
  apiGraphs?: Array<NamedNode | string>
}

export interface Options {
  dataset?: DatasetCore
  resourceShapeLookup?: ResourceShapeLookup
  resourceLoaderLookup?: ResourceLoaderLookup
  handlerLookup?: HandlerLookup
}

type Dataset = ReturnType<KopflosEnvironment['dataset']>

export default class Impl implements Kopflos {
  readonly dataset: Dataset
  readonly env: KopflosEnvironment

  constructor(private readonly config: KopflosConfig, private readonly options: Options = {}) {
    this.env = createEnv(config)

    this.dataset = this.env.dataset([
      ...options.dataset || [],
    ])

    log.info('Kopflos initialized')
    log.debug('Options %O', {
      sparqlEndpoints: Object.keys(this.env.sparql),
      resourceShapeLookup: options.resourceShapeLookup?.name ?? 'default',
      resourceLoaderLookup: options.resourceLoaderLookup?.name ?? 'default',
      handlerLookup: options.handlerLookup?.name ?? 'default',
    })
  }

  get graph() {
    return this.env.clownface({ dataset: this.dataset })
  }

  get apis(): MultiPointer {
    return this.graph.has(this.env.ns.rdf.type, this.env.ns.kopflos.Api)
  }

  async handleRequest(req: KopflosRequest): Promise<ResultEnvelope> {
    const result = await responseOr(this.findResourceShape(req.iri), (resourceShapeMatch: ResourceShapeMatch) => {
      const resourceShape = this.graph.node(resourceShapeMatch.resourceShape)

      return responseOr(this.findResourceLoader(resourceShape), loader => {
        const coreRepresentation = loader(resourceShapeMatch.subject, this)

        return responseOr(this.loadHandler(req.method, resourceShapeMatch, coreRepresentation), async handler => {
          const resourceGraph = this.env.clownface({
            dataset: await this.env.dataset().import(coreRepresentation),
          })
          const args: HandlerArgs = {
            resourceShape,
            env: this.env,
            subject: resourceGraph.node(resourceShapeMatch.subject),
            property: undefined,
            object: undefined,
          }
          if ('property' in resourceShapeMatch) {
            args.property = resourceShapeMatch.property
            args.object = resourceGraph.node(resourceShapeMatch.object)
          }

          return handler(args)
        })
      })
    })

    if (this.isEnvelope(result)) {
      return result
    }

    return {
      status: 200,
      body: result,
    }
  }

  async findResourceShape(iri: NamedNode): Promise<ResourceShapeMatch | KopflosResponse> {
    const resourceShapeLookup = this.options.resourceShapeLookup || defaultResourceShapeLookup

    return responseOr(resourceShapeLookup(iri, this), async candidates => {
      if (candidates.length === 0) {
        log.info('Resource shape not found for %s', iri.value)
        return { status: 404 }
      }

      if (candidates.length > 1) {
        log.error('Multiple resource shapes found %O', candidates.map(c => c.resourceShape.value))
        return new Error('Multiple resource shapes found')
      }

      if (log.enabledFor('debug')) {
        const logMatch: Record<string, string> = {
          resourceShape: candidates[0].resourceShape.value,
          subject: candidates[0].subject.value,
        }
        if ('property' in candidates[0]) {
          logMatch.property = candidates[0].property.value
          logMatch.object = candidates[0].object.value
        }

        log.debug('Resource shape matched %O', logMatch)
      }
      return candidates[0]
    })
  }

  async findResourceLoader(resourceShape: GraphPointer): Promise<ResourceLoader | KopflosResponse> {
    const resourceLoaderLookup = this.options.resourceLoaderLookup || findResourceLoader

    const loader = await resourceLoaderLookup(resourceShape, this.env)

    if (loader) {
      return loader
    }

    log.debug('Using default loader')
    return fromOwnGraph
  }

  async loadHandler(method: HttpMethod, resourceShapeMatch: ResourceShapeMatch, coreRepresentation: Stream): Promise<Handler | KopflosResponse> {
    const handlerLookup = this.options.handlerLookup || loadHandler

    const handler = await handlerLookup(resourceShapeMatch, method, this)

    if (handler) {
      return handler
    }

    if (!('property' in resourceShapeMatch) && (method === 'GET' || method === 'HEAD')) {
      log.info('No handler found. Returning Core representation')
      return {
        status: 200,
        body: coreRepresentation,
      }
    }

    log.info('No handler found')
    return { status: 405 }
  }

  private isEnvelope(arg: KopflosResponse): arg is ResultEnvelope {
    return 'body' in arg || 'status' in arg
  }

  static async fromGraphs(kopflos: Impl, ...graphs: Array<NamedNode | string>): Promise<void> {
    const graphsIris = graphs.map(graph => typeof graph === 'string' ? kopflos.env.namedNode(graph) : graph)
    log.info('Loading graphs %O', graphsIris.map(g => g.value))

    const quads = CONSTRUCT`?s ?p ?o `
      .WHERE`
        GRAPH ?g {
          ?s ?p ?o
        }
        
        FILTER (?g ${IN(...graphsIris)})
      `.execute(kopflos.env.sparql.default.stream)

    for await (const quad of quads) {
      kopflos.dataset.add(quad)
    }

    await insertShorthands(kopflos)

    log.info('Graphs loaded. Dataset now contains %d quads', kopflos.dataset.size)
  }
}
