import type { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders } from 'node:http'
import type { parse } from 'node:querystring'
import type { ReadableStream } from 'node:stream/web'
import type { DatasetCore, NamedNode, Quad, Stream, Term } from '@rdfjs/types'
import type { GraphPointer, MultiPointer } from 'clownface'
import type { Options as EndpointOptions, StreamClient } from 'sparql-http-client/StreamClient.js'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import type { Client } from 'sparql-http-client'
import onetime from 'onetime'
import { kl } from '../ns.js'
import ShorthandTerms from '../plugin/shorthandTerms.js'
import type { KopflosEnvironment } from './env/index.js'
import { createEnv } from './env/index.js'
import type { ResourceShapeLookup, ResourceShapeMatch } from './resourceShape.js'
import defaultResourceShapeLookup from './resourceShape.js'
import { isResponse } from './isResponse.js'
import type { ResourceLoader, ResourceLoaderLookup } from './resourceLoader.js'
import { fromOwnGraph, findResourceLoader } from './resourceLoader.js'
import type { Handler, HandlerArgs, HandlerLookup } from './handler.js'
import { loadHandlers } from './handler.js'
import type { HttpMethod } from './httpMethods.js'
import log from './log.js'
import type { DecoratorLookup, RequestDecorator } from './decorators.js'
import { loadDecorators } from './decorators.js'

declare module '@rdfjs/types' {
  interface Stream extends AsyncIterable<Quad> {}
}

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

type ResultBody = Stream | DatasetCore | GraphPointer | Error | ReadableStream

export interface ResultEnvelope {
  body?: ResultBody | string
  status?: number
  headers?: OutgoingHttpHeaders
  end?: boolean
}

export type KopflosResponse = ResultBody | ResultEnvelope

export interface KopflosPlugin {
  /* eslint-disable no-use-before-define */
  readonly name?: string
  onStart?(instance: Kopflos): Promise<void> | void
  onReady?(instance: Kopflos): Promise<void> | void
  onStop?(instance: Kopflos): Promise<void> | void
  apiTriples?(instance: Kopflos): Promise<DatasetCore | Stream> | DatasetCore | Stream
  build?: (env: KopflosEnvironment) => Promise<void> | void
}

export interface Plugins extends Record<string, KopflosPlugin> {
}

export interface Kopflos<D extends DatasetCore = Dataset> {
  get dataset(): D
  get env(): KopflosEnvironment
  get apis(): MultiPointer<Term, D>
  // eslint-disable-next-line no-use-before-define
  get plugins(): ReadonlyArray<KopflosPlugin>
  get start(): () => Promise<void>
  getPlugin<N extends keyof Plugins>(name: N): Plugins[N] | undefined
  handleRequest(req: KopflosRequest<D>): Promise<ResultEnvelope>
  loadApiGraphs(): Promise<void>
}

interface Clients {
  stream: StreamClient
  parsed: ParsingClient
}

type Endpoint = string | EndpointOptions | Clients | Client

export interface Variables {
  [key: string]: unknown
}

export interface KopflosConfig {
  [key: string]: unknown
  mode?: 'development' | 'production'
  baseIri: string
  buildDir?: string
  sparql: Record<string, Endpoint> & { default: Endpoint }
  codeBase?: string
  apiGraphs?: Array<NamedNode | string>
  plugins?: KopflosPlugin[]
  variables?: Variables
}

export interface Options {
  dataset?: DatasetCore
  resourceShapeLookup?: ResourceShapeLookup
  resourceLoaderLookup?: ResourceLoaderLookup
  decoratorLookup?: DecoratorLookup
  handlerLookup?: HandlerLookup
  basePath?: string
}

export default class Impl implements Kopflos {
  readonly dataset: Dataset
  readonly env: KopflosEnvironment
  readonly plugins: Array<KopflosPlugin>
  readonly start: () => Promise<void>
  readonly ready: () => Promise<void>

  private decorators: Map<Term, RequestDecorator[]>

  constructor({ variables = {}, plugins = [], ...config }: KopflosConfig, private readonly options: Options = {}) {
    this.env = createEnv({ variables, ...config }, options.basePath)
    this.plugins = [
      new ShorthandTerms(),
      ...plugins,
    ]
    this.decorators = this.env.termMap()

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
      variables,
    })

    this.start = onetime(async function (this: Impl) {
      await Promise.all(this.plugins.map(plugin => plugin.onStart?.(this)))
    }).bind(this)

    this.ready = onetime(async function (this: Impl) {
      await Promise.all(this.plugins.map(plugin => plugin.onReady?.(this)))
    }).bind(this)
  }

  get graph() {
    return this.env.clownface({ dataset: this.dataset })
  }

  get apis(): MultiPointer<Term, Dataset> {
    return this.graph.has(this.env.ns.rdf.type, this.env.ns.kopflos.Api)
  }

  getPlugin<N extends keyof Plugins>(name: N): Plugins[N] | undefined {
    return this.plugins.find(plugin => plugin.name === name) as Plugins[N] | undefined
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
    const handlerChain = await this.loadHandlerChain(req.method, resourceShapeMatch, coreRepresentation)
    if (isResponse(handlerChain)) {
      return handlerChain
    }
    const resourceGraph = this.env.clownface({
      dataset: await this.env.dataset().import(coreRepresentation),
    })
    const subjectVariables = 'subjectVariables' in resourceShapeMatch
      ? Object.fromEntries(resourceShapeMatch.subjectVariables)
      : {}

    const [handler, implementation] = handlerChain
    const args: HandlerArgs = {
      ...req,
      handler,
      headers: req.headers,
      resourceShape,
      env: this.env,
      subject: resourceGraph.node(resourceShapeMatch.subject),
      subjectVariables,
      property: undefined,
      object: undefined,
    }
    if ('property' in resourceShapeMatch) {
      args.property = resourceShapeMatch.property
      args.object = resourceGraph.node(resourceShapeMatch.object)
    }

    type HandlerClosure = () => Promise<KopflosResponse> | KopflosResponse
    const runHandlers: HandlerClosure = async () => {
      let response: ResultEnvelope | undefined
      for (let i = 0; i < implementation.length; i++) {
        const handler = implementation[i]
        const rawResult = await handler(args, response)

        response = this.asEnvelope(rawResult)
        if (response.end) {
          break
        }
      }

      return this.asEnvelope(response)
    }

    const decorators = await this.applicableDecorators(args)
    const decoratedHandlers = decorators.reduceRight<HandlerClosure>((next, decorator) =>
      decorator.run.bind(decorator, args, async () => this.asEnvelope(await next())), runHandlers)

    return decoratedHandlers()
  }

  private async applicableDecorators(args: HandlerArgs): Promise<RequestDecorator[]> {
    const api = args.resourceShape.out(kl.api) as GraphPointer
    if (!this.decorators.has(api.term)) {
      const decoratorLookup = this.options.decoratorLookup || loadDecorators
      const decorators = await decoratorLookup({ api, env: this.env })
      this.decorators.set(api.term, decorators.map(Decorator => new Decorator(this)))
    }

    const allDecorators = this.decorators.get(api.term)!
    const decorators = await Promise.all(allDecorators.map(async decorator => {
      let isApplicable = true
      if (decorator.applicable) {
        isApplicable = await decorator.applicable(args)
      }

      return isApplicable ? decorator : undefined
    }))

    return decorators.filter(Boolean) as RequestDecorator[]
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

  async loadHandlerChain(method: HttpMethod, resourceShapeMatch: ResourceShapeMatch, coreRepresentation: Stream): Promise<[GraphPointer, Handler[]] | KopflosResponse> {
    const handlerLookup = this.options.handlerLookup || loadHandlers

    const result = handlerLookup(resourceShapeMatch, method, this)

    if (result) {
      const handlers = await Promise.all(result.implementation)
      if (handlers.length) {
        return [result.pointer, handlers]
      }
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

  private asEnvelope(arg: KopflosResponse | undefined): ResultEnvelope {
    if (!arg) {
      log.error('Falsy result returned from handler')
      return {
        status: 500,
        body: new Error('Handler did not return a result'),
        end: true,
      }
    }

    if (this.isEnvelope(arg)) {
      return arg
    }
    return {
      status: 200,
      body: arg,
    }
  }

  async loadApiGraphs(): Promise<void> {
    const graphs = this.env.kopflos.config.apiGraphs

    if (!graphs?.length) {
      throw new Error('No API graphs configured. In a future release it will be possible to select graphs dynamically.')
    }

    this.dataset.deleteMatches()

    const graphsIris = graphs.map(graph => typeof graph === 'string' ? this.env.namedNode(graph) : graph)
    log.info('Loading graphs', graphsIris.map(g => g.value))

    const quads = CONSTRUCT`?s ?p ?o `
      .WHERE`
        GRAPH ?g {
          ?s ?p ?o
        }
        
        FILTER (?g ${IN(...graphsIris)})
      `.execute(this.env.sparql.default.stream)

    for await (const quad of quads) {
      this.dataset.add(quad)
    }

    const apiTriples = this.plugins.map(async plugin => {
      if (!plugin.apiTriples) {
        return
      }

      const triples = await plugin.apiTriples(this)
      for await (const quad of triples) {
        this.dataset.add(quad)
      }
      log.debug('API triples loaded from plugin', plugin.name)
    })

    await Promise.all(apiTriples)
    log.info(`Graphs loaded. Dataset now contains ${this.dataset.size} quads`)
    if (log.enabledFor('trace')) {
      log.trace('API Dataset', await this.dataset.serialize({
        format: 'text/turtle',
        prefixes: ['sh', 'rdf', 'xsd', ['kl', this.env.ns.kopflos().value]],
      }))
    }
  }

  async stop() {
    await Promise.all(this.plugins.map(async plugin => { plugin.onStop?.(this) }))
  }
}
