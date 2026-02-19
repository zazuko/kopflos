import type {HandlerArgs, Kopflos, KopflosEnvironment, KopflosPlugin} from '@kopflos-cms/core'
import type {DatasetCore} from "@rdfjs/types";
import {globIterate} from 'glob'
import * as path from "node:path";
import type {AnyPointer} from "clownface";
import type {TemplateResult} from 'lit';
import type {QueryExecutor} from 'sparqlc'
import {toPattern} from "./route";
import {SsrOptions} from "./ssr";
import {BuildConfiguration, VitePlugin} from "@kopflos-cms/vite";
import {ViteDevServer} from "vite";
import sparqlLoaderPlugin from 'vite-plugin-sparql'
import pagesVitePlugin from './vitePlugin.js'

export interface QueryDescriptor {
    query: QueryExecutor
    endpoint?: string
}

export type QueryMap = Record<string, QueryDescriptor | QueryExecutor>

export interface PageRenderer<TQueries extends QueryMap | undefined = {}> {
    parameters?: Record<string, string>
    head?: string | ((args: HandlerArgs & { data: { [P in keyof TQueries]: AnyPointer } }) => string | Promise<string>)
    import?: () => Promise<void>
    body: (args: HandlerArgs & { data: { [P in keyof TQueries]: AnyPointer } }) => TemplateResult | Promise<TemplateResult>
    data?: Record<string, AnyPointer | DatasetCore>
    queries?: TQueries
}

interface Options {
    api: string
    path?: string
    pattern?: string
    ssrOptions?: SsrOptions
}

interface PagesPlugin extends KopflosPlugin {
    readonly path: string
    readonly ssrOptions: SsrOptions
    getDevServer({ env, plugins }: Kopflos): Promise<ViteDevServer>
}

declare module '@kopflos-cms/core' {
    interface Plugins {
        '@kopflos-labs/pages': PagesPlugin
    }
}

export const definePageRenderer = <TQueries extends Record<string, QueryDescriptor | QueryExecutor>>(renderer: PageRenderer<TQueries>) => renderer;

export default class extends VitePlugin implements PagesPlugin {
    private readonly pattern: string;
    public readonly path: string;
    private readonly api: string;
    public readonly ssrOptions: SsrOptions
    private readonly buildConfiguration: BuildConfiguration;

    constructor({api, path = 'pages', pattern = '**/*.html.ts', ssrOptions = { deferHydration: true }}: Options) {
        const buildConfiguration = <BuildConfiguration>{
            root: path,
            entrypoints: ['**/*.html'],
            config: {
                plugins: [
                    sparqlLoaderPlugin,
                    pagesVitePlugin(ssrOptions),
                ],
            }
        }
        super('@kopflos-labs/pages', [buildConfiguration])
        this.buildConfiguration = buildConfiguration
        this.api = api
        this.path = path;
        this.pattern = pattern
        this.ssrOptions = ssrOptions;
    }

    getDevServer({ env, plugins }: Kopflos) {
        return super.getViteDevServer(env, this.getDefaultPlugin(plugins), this.buildConfiguration)
    }

    async deployedResources(env: KopflosEnvironment): Promise<DatasetCore> {
        const {rdf, kl, sh, code, schema} = env.ns
        const talos = env.namespace('urn:talos:')

        const cwd = path.resolve(env.kopflos.basePath, this.path)

        const dataset = env.dataset()
        const graph = env.clownface({
            dataset,
            graph: kl.Pages,
        })
        env.clownface({ dataset, graph: talos.resources })
            .node(kl.Pages)
            .addOut(talos.action, talos.overwrite)

        for await(const file of globIterate(this.pattern, { cwd })) {
            const resourceShape = graph
                .namedNode(kl.Pages.value + '#' + encodeURIComponent(file))

            const ssrModule = path.join(this.path, file)
            const html = ssrModule.replace(/\.\w+$/, '')

            resourceShape
                .addOut(rdf.type, kl.ResourceShape)
                .addOut(kl.api, env.namedNode(this.api))
                .addOut(sh.target, target => {
                    target
                        .addOut(rdf.type, kl.PatternedTarget)
                        .addOut(kl.regex, toPattern(file))
                })
                .addOut(kl.handler, handler => {
                    handler
                        .addOut(rdf.type, kl.Handler)
                        .addOut(kl.method, 'GET')
                        .addList(code.implementedBy, [
                            graph.blankNode()
                                .addOut(rdf.type, code.EcmaScriptModule)
                                .addOut(code.link, graph.namedNode('node:@kopflos-labs/pages/handler.js#default'))
                                .addList(code.arguments, [graph.literal(html), ssrModule]),
                        ])
                })

            const renderer: PageRenderer = (await import(path.join(cwd, file))).default

            const mainEntity = renderer.parameters?.['schema:mainEntity']
            if (mainEntity) {
                resourceShape
                    .addOut(sh.property, property => {
                        property
                            .addOut(sh.path, schema.mainEntity)
                            .addOut(sh.pattern, toPattern(mainEntity))
                    })
            }
        }

        return dataset
    }
}
