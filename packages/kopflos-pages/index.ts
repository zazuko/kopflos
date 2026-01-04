import type {HandlerArgs, KopflosEnvironment, KopflosPlugin} from '@kopflos-cms/core'
import type {DatasetCore} from "@rdfjs/types";
import {globIterate} from 'glob'
import {join} from "node:path";
import type {AnyPointer} from "clownface";
import type {ViteDevServer} from "vite";

export interface PageRenderer {
    head?(): string | Promise<string>
    body(): unknown | Promise<unknown>
    data?: Record<string, AnyPointer | DatasetCore>
}

export interface SsrModule {
    (arg: {
        req: HandlerArgs
        vite: ViteDevServer
        html: string
        renderer(req: HandlerArgs): Promise<PageRenderer>
    }): Promise<string>
}

interface Options {
    api: string
    path: string
    ssr: SsrModule
    pattern?: string
}

interface PagesPlugin extends KopflosPlugin {
    ssr: SsrModule
}

declare module '@kopflos-cms/core' {
    interface PluginConfig {
        '@kopflos-labs/pages': Options
    }

    interface Plugins {
        '@kopflos-labs/pages': PagesPlugin
    }
}

export const definePageRenderer = (fn: (req: HandlerArgs) => Promise<PageRenderer>) => fn;

export default class implements PagesPlugin {
    readonly name = '@kopflos-labs/pages'
    private readonly pattern: string;
    private readonly path: string;
    private readonly api: string;
    public readonly ssr: SsrModule;

    constructor({api, path, pattern = '**/*.html.ts', ssr}: Options) {
        this.ssr = ssr
        this.api = api
        this.path = path;
        this.pattern = pattern
    }

    async deployedResources(env: KopflosEnvironment): Promise<DatasetCore> {
        const {rdf, kl, sh, code} = env.ns
        const talos = env.namespace('urn:talos:')

        const dataset = env.dataset()
        const graph = env.clownface({
            dataset,
            graph: kl.Pages,
        })
        env.clownface({ dataset, graph: talos.resources })
            .node(kl.Pages)
            .addOut(talos.action, talos.overwrite)

        for await(const file of globIterate(this.pattern, {cwd: this.path})) {
            const resourceShape = graph
                .namedNode(kl.Pages.value + '#' + encodeURIComponent(file))

            const ssrModule = join(this.path, file)
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
        }

        return dataset
    }
}

function toPattern(file: string): string {
    const pattern = /\[\[(?<optionalVar>\w+)]]|\[(?<requiredVar>\w+)]|\[\.\.\.(?<catchAllVar>\w+)]/g

    return file.replaceAll(pattern, (match, optionalVar, requiredVar, catchAllVar) => {
        if (optionalVar) {
            return `(?<${optionalVar}>[^/]+)?`
        }
        if (requiredVar) {
            return `(?<${requiredVar}>[^/]+)`
        }
        if (catchAllVar) {
            return `(?<${catchAllVar}>[/\w]+)`
        }
        return match
    }).replace(/\.\w+$/, '$')
}
