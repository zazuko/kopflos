import type { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders } from 'node:http'
import type { parse } from 'node:querystring'
import type { DatasetCore, NamedNode, Stream, Term } from '@rdfjs/types'
import type { GraphPointer, MultiPointer } from 'clownface'
import type { Options as EndpointOptions, StreamClient } from 'sparql-http-client/StreamClient.js'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import type { Client } from 'sparql-http-client'
import type { KopflosEnvironment } from './env/index.js'
import { createEnv } from './env/index.js'
import type { ResourceShapeLookup, ResourceShapeMatch } from './resourceShape.js'
import defaultResourceShapeLookup from './resourceShape.js'
import { isResponse } from './isResponse.js'
import type { ResourceLoader, ResourceLoaderLookup } from './resourceLoader.js'
import { insertShorthands, fromOwnGraph, findResourceLoader } from './resourceLoader.js'
import type { Handler, HandlerArgs, HandlerLookup } from './handler.js'
import { loadHandler } from './handler.js'
import type { HttpMethod } from './httpMethods.js'
import log from './log.js'

type Dataset = ReturnType<KopflosEnvironment['dataset']>

export interface Body<D extends DatasetCore = Dataset> {
  isRDF: boolean
  quadStream: Stream
  dataset: Promise<D>
  pointer(): Promise<GraphPointer<NamedNode, D>>
  raw: IncomingMessage
}

export type Query = ReturnType<typeof parse>

interface KopflosRequest<D extends DatasetCore = DatasetCore> {
  iri: NamedNode
  method: HttpMethod
  headers: IncomingHttpHeaders
  body: Body<D>
  query: Query
}

type ResultBody = Stream | DatasetCore | GraphPointer | Error
export interface ResultEnvelope {
  body?: ResultBody | string
  status?: number
  headers?: OutgoingHttpHeaders
}
export type KopflosResponse = ResultBody | ResultEnvelope

export interface KopflosPlugin {
  onStart?(env: KopflosEnvironment): Promise<void> | void
}

export interface Kopflos<D extends DatasetCore = Dataset> {
  get env(): KopflosEnvironment
  get apis(): MultiPointer<Term, D>
  get plugins(): Array<KopflosPlugin>
  start(): Promise<void>
  handleRequest(req: KopflosRequest<D>): Promise<ResultEnvelope>
}

interface Clients {
  stream: StreamClient
  parsed: ParsingClient
}

type Endpoint = string | EndpointOptions | Clients | Client

export interface KopflosConfig {
  baseIri: string
  sparql: Record<string, Endpoint> & { default: Endpoint }
  codeBase?: string
  apiGraphs?: Array<NamedNode | string>
  plugins?: Array<string | [string, unknown]>
}

export interface Options {
  dataset?: DatasetCore
  resourceShapeLookup?: ResourceShapeLookup
  resourceLoaderLookup?: ResourceLoaderLookup
  handlerLookup?: HandlerLookup
}

export default class Impl implements Kopflos {
  readonly dataset: Dataset
  readonly env: KopflosEnvironment
  _plugins: Array<KopflosPlugin> | undefined
  readonly loadPlugins: () => Promise<void>

  constructor({ plugins = [], ...config }: KopflosConfig, private readonly options: Options = {}) {
    this.env = createEnv(config)

    this.dataset = this.env.dataset([
      ...options.dataset || [],
    ])

    log.info('Kopflos initialized')
    log.debug('Options', {
      sparqlEndpoints: Object.fromEntries(Object.entries(this.env.sparql).map(([key, value]) => {
        return [key, {
          endpointUrl: value.parsed.endpointUrl,
          updateUrl: value.parsed.updateUrl,
          storeUrl: value.parsed.storeUrl,
        }]
      })),
      resourceShapeLookup: options.resourceShapeLookup?.name ?? 'default',
      resourceLoaderLookup: options.resourceLoaderLookup?.name ?? 'default',
      handlerLookup: options.handlerLookup?.name ?? 'default',
    })

    this.loadPlugins = async () => {
      this._plugins = await Promise.all(plugins.map(async plugin => {
        let name: string
        let options: unknown
        if (typeof plugin === 'string') {
          name = plugin
          options = {}
        } else {
          [name, options] = plugin
        }

        log.info('Loading plugin', name)

        const pluginFactory = await import(name)
        return pluginFactory.default(options)
      }))
    }
  }

  get graph() {
    return this.env.clownface({ dataset: this.dataset })
  }

  get apis(): MultiPointer<Term, Dataset> {
    return this.graph.has(this.env.ns.rdf.type, this.env.ns.kopflos.Api)
  }

  get plugins() {
    if (!this._plugins) {
      throw new Error('Plugins not loaded. Did you forget to call Kopflos.loadPlugins()?')
    }

    return this._plugins
  }

  async getResponse(req: KopflosRequest<Dataset>): Promise<KopflosResponse> {
    const resourceShapeMatch = await this.findResourceShape(req.iri)
    if (isResponse(resourceShapeMatch)) {
      return resourceShapeMatch
    }
    const resourceShape = this.graph.node(resourceShapeMatch.resourceShape)
    const loader = await this.findResourceLoader(resourceShape)
    if (isResponse(loader)) {
      return loader
    }
    const coreRepresentation = loader(resourceShapeMatch.subject, this)
    const handler = await this.loadHandler(req.method, resourceShapeMatch, coreRepresentation)
    if (isResponse(handler)) {
      return handler
    }
    const resourceGraph = this.env.clownface({
      dataset: await this.env.dataset().import(coreRepresentation),
    })
    const args: HandlerArgs = {
      ...req,
      headers: req.headers,
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
  }

  async handleRequest(req: KopflosRequest<Dataset>): Promise<ResultEnvelope> {
    log.info(`${req.method} ${req.iri.value}`)
    log.debug('Request headers', req.headers)

    let result: KopflosResponse
    try {
      result = await this.getResponse(req)
    } catch (cause: Error | unknown) {
      const error = cause instanceof Error
        ? cause
        : typeof cause === 'string'
          ? new Error(cause)
          : new Error('Unknown error', { cause })
      log.error(error)
      return {
        status: 500,
        body: error,
      }
    }

    if (!result) {
      log.error('Undefined result returned from handler')
      return {
        status: 500,
        body: new Error('Handler did not return a result'),
      }
    }

    if (!this.isEnvelope(result)) {
      result = {
        status: 200,
        body: result,
      }
    }

    log.info('Response status', result.status)
    return result
  }

  async findResourceShape(iri: NamedNode): Promise<ResourceShapeMatch | KopflosResponse> {
    const resourceShapeLookup = this.options.resourceShapeLookup || defaultResourceShapeLookup

    const candidates = await resourceShapeLookup(iri, this)
    if (isResponse(candidates)) {
      return candidates
    }
    if (candidates.length === 0) {
      log.info(`Resource shape not found for ${iri.value}`)
      return { status: 404 }
    }

    if (candidates.length > 1) {
      log.error('Multiple resource shapes found:', candidates.map(c => c.resourceShape.value))
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

      log.debug('Resource shape matched:', logMatch)
    }
    return candidates[0]
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

  async start() {
    await Promise.all(this.plugins.map(plugin => plugin.onStart?.(this.env)))
  }

  static async fromGraphs(kopflos: Impl, ...graphs: Array<NamedNode | string>): Promise<void> {
    const graphsIris = graphs.map(graph => typeof graph === 'string' ? kopflos.env.namedNode(graph) : graph)
    log.info('Loading graphs', graphsIris.map(g => g.value))

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

    log.info(`Graphs loaded. Dataset now contains ${kopflos.dataset.size} quads`)
  }
}
