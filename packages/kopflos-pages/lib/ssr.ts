import {render} from '@lit-labs/ssr'
import {LitElementRenderer} from '@lit-labs/ssr/lib/lit-element-renderer.js'
import {collectResult} from '@lit-labs/ssr/lib/render-result.js'
import {getWindow} from '@lit-labs/ssr/lib/dom-shim.js'
import {load} from 'cheerio'
import Serializer from '@rdfjs/serializer-rdfjs'
import * as esbuild from 'esbuild';
import {setLanguages} from "@rdfjs-elements/lit-helpers";
import {PageRenderer, QueryMap} from "@kopflos-labs/pages";
import { Stream, Term} from "@rdfjs/types";
import {AnyPointer} from "clownface";
import {QueryExecutor} from "sparqlc";
import {HandlerArgs} from "@kopflos-cms/core";
import TermMap from "@rdfjs/term-map";
import {expand} from "@zazuko/prefixes";
import SparqlProcessor from './SparqlProcessor.js'
import selectPagePatterns from '../queries/page-patterns.rq'
import type {ViteDevServer} from "vite";
import type {Readable} from "node:stream";
import PageUrlTransform from "./PageUrlTransform";

export type SsrOptions = Parameters<typeof render>[1]

interface SsrModule {
    (arg: {
        req: HandlerArgs
        vite: ViteDevServer
        html: string
        options: SsrOptions
        renderer: PageRenderer<{}>
    }): Promise<string>
}

const serializer = new Serializer();

(globalThis as any).window = <any>getWindow({
    includeJSBuiltIns: true,
})
// @ts-ignore
globalThis.litSsrCallConnectedCallback = (element: any) => {
    return !element.tagName.startsWith('WA-')
}

type RendererData = NonNullable<PageRenderer['data']>
type ParamMapEntry = [Term, Term | Term[]]

async function executeQueries(renderer: PageRenderer, queries: QueryMap, { env, subjectVariables, query: queryParams }: HandlerArgs): Promise<RendererData> {
    const data: RendererData = renderer.data || {}

    const pagePatterns = await selectPagePatterns({ env, client: env.sparql.default.parsed })

    for (const [name, descriptor] of Object.entries(queries)) {
        const query: QueryExecutor = typeof descriptor === 'function' ? descriptor : descriptor.query
        const endpoint: string | undefined = typeof descriptor === 'object' ? descriptor.endpoint : undefined

        const client = endpoint ? (env.sparql as any)[endpoint].stream : env.sparql.default.stream
        const params: TermMap<Term, Term | Term[]> = new TermMap<Term, Term | Term[]>([
            ...Object.entries(subjectVariables).map<ParamMapEntry>(([key, value]) => [env.literal(key), env.literal(value)]),
            ...Object.entries(queryParams).reduce((acc, [key, value]): ParamMapEntry[] => {
                if (Array.isArray(value)) {
                    return [...acc, [env.literal(key), value.map(v => env.literal(v.toString()))]]
                }
                if (!value) {
                    return acc
                }
                return [...acc, [env.literal(key), env.literal(value.toString())]]
            }, []),
        ])

        if (renderer.parameters) {
            for (const [key, pattern] of Object.entries(renderer.parameters)) {
                const keyTerm = expand(key) ? env.namedNode(expand(key)) : env.literal(key)

                if (params.has(keyTerm)) continue;

                const variables: string[] = []
                const regexStr = pattern.replace(/\[(\w+)]/g, (_, name) => {
                    variables.push(name)
                    return '(?<' + name + '>[^/]+)'
                })
                const regex = new RegExp(`^${regexStr}$`)

                // We need to find if any of the subjectVariables match the pattern's variables
                // Actually, if we are in [name].html, subjectVariables['name'] is available.
                // If the pattern is 'https://.../[name]', we can reconstruct the IRI.
                let iri = pattern
                let allVarsFound = true
                for (const v of variables) {
                    if (subjectVariables[v]) {
                        iri = iri.replace(`[${v}]`, subjectVariables[v])
                    } else {
                        allVarsFound = false
                        break
                    }
                }

                if (allVarsFound) {
                    params.set(keyTerm, env.literal(iri))
                }
            }
        }

        const result = await query(params, {
            env,
            client,
            processors: [
                new SparqlProcessor(env, pagePatterns)
            ]
        }) as Stream & Readable
        data[name] = env.clownface({
            dataset: await env.dataset().import(result.pipe(new PageUrlTransform(pagePatterns, env)))
        })
    }
    return data;
}

const ssr: SsrModule = async ({ renderer, vite, html, req, options: ssrOptions = {} }) => {
    const { head, body } = renderer
    const queries: QueryMap = renderer.queries || {}

    const data = await executeQueries(renderer, queries, req);

    setLanguages(...req.headers["accept-language"] || [])

    const $ = load(html)

    if (head) {
        $('head').append(await (typeof head === 'function' ? head({ ...req, data: data as Record<string, AnyPointer> }) : head))
    }

    await renderer.import?.()

    const { Renderer, usedData } = prepareRenderer(data)
    $('body').prepend(await collectResult(render(await body({...req, data}), {
        ...ssrOptions,
        elementRenderers: [
            ...ssrOptions.elementRenderers || [],
            Renderer,
        ],
    })))

    if (usedData.size) {
        let script = [
            'window.graphs = window.graphs || {};',
            ...[...usedData].map((name) => {
                const datasetOrPointer = data[name];
                const dataset = 'terms' in datasetOrPointer ? (datasetOrPointer as AnyPointer).dataset : datasetOrPointer
                return serializer.transform(dataset).replace('export default', `window.graphs.${name} =`);
            })
        ].join('\n')

        const isMinify = vite ? (vite.config.build.minify && vite.environments.client.mode !== 'dev') : true;
        if (isMinify) {
            script = (await esbuild.transform(script, {
                minify: true,
                target: 'esnext'
            })).code
        }
        $('head').prepend(`<script type="module">${script}</script>`)
    }

    return $.html({
        xml: {
            xmlMode: false,
        },
    })
}

function prepareRenderer(data: RendererData) {
    const usedData: Set<string> = new Set()

    class Renderer extends LitElementRenderer {
        connectedCallback(): void {
            if (this.element?.hasAttribute('data-graph')) {
                const value = this.element.getAttribute('data-graph')!
                usedData.add(value)
                this.setProperty('graph', data[value])
            }

            return super.connectedCallback()
        }

        *renderShadow(ri: any) {
            const shadow = super.renderShadow(ri)

            yield '<open-styles></open-styles>'
            yield * shadow
        }
    }

    return {
        Renderer,
        usedData,
    }
}

export default ssr
