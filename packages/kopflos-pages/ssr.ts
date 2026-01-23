import {ElementRenderer, render} from '@lit-labs/ssr'
import {LitElementRenderer} from '@lit-labs/ssr/lib/lit-element-renderer.js'
import {collectResult} from '@lit-labs/ssr/lib/render-result.js'
import {getWindow} from '@lit-labs/ssr/lib/dom-shim.js'
import {load} from 'cheerio'
import Serializer from '@rdfjs/serializer-rdfjs'
import * as esbuild from 'esbuild';
import {setLanguages} from "@rdfjs-elements/lit-helpers";
import {PageRenderer, QueryMap, SsrModule} from "@kopflos-labs/pages";
import {Stream} from "@rdfjs/types";
import {AnyPointer} from "clownface";
import {QueryExecutor} from "sparqlc";
import {KopflosEnvironment} from "@kopflos-cms/core";

const serializer = new Serializer();

(globalThis as any).window = <any>getWindow({
    includeJSBuiltIns: true,
})
// @ts-ignore
globalThis.litSsrCallConnectedCallback = (element: any) => {
    return !element.tagName.startsWith('WA-')
}

type RendererData = NonNullable<PageRenderer['data']>

async function executeQueries(renderer: PageRenderer, queries: QueryMap, env: KopflosEnvironment, subjectVariables: Record<string, string>, queryParams: NodeJS.Dict<string | string[]>): Promise<RendererData> {
    const data: RendererData = renderer.data || {}

    for (const [name, descriptor] of Object.entries(queries)) {
        const query: QueryExecutor = typeof descriptor === 'function' ? descriptor : descriptor.query
        const endpoint: string | undefined = typeof descriptor === 'object' ? descriptor.endpoint : undefined

        const client = endpoint ? (env.sparql as any)[endpoint].stream : env.sparql.default.stream
        const params: Record<string, any> = {
            ...Object.entries(subjectVariables).reduce((acc, [key, value]) => ({
                ...acc,
                [key]: env.literal(value)
            }), {}),
            ...Object.entries(queryParams).reduce((acc, [key, value]) => {
                if (Array.isArray(value)) {
                    return {...acc, [key]: value.map(v => env.literal(v.toString()))}
                }
                if (!value) {
                    return acc
                }
                return {...acc, [key]: env.literal(value.toString())}
            }, {}),
        }

        const result = await query(params, env, client) as Stream
        data[name] = env.clownface({
            dataset: await env.dataset().import(result)
        })
    }
    return data;
}

const ssr: SsrModule = async ({ renderer, vite, html, req, options: ssrOptions }) => {
    const { head, body } = renderer
    const queries: QueryMap = renderer.queries || {}
    const {env, subjectVariables, query: queryParams} = req

    const data = await executeQueries(renderer, queries, env, subjectVariables, queryParams);

    setLanguages(...req.headers["accept-language"] || [])

    const $ = load(html)

    if (head) {
        $('head').append(await (typeof head === 'function' ? head({ ...req, data: data as Record<string, AnyPointer> }) : head))
    }

    await renderer.import?.()

    const { Renderer, usedData } = prepareRenderer(data)
    $('body').prepend(await collectResult(render(await body({...req, data}), {
        ...ssrOptions,
        elementRenderers: [Renderer],
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
                minify: true
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

    class Renderer implements ElementRenderer {
        static matchesClass(el: typeof HTMLElement, tag: string, attrs: Map<string, string>): boolean {
            return attrs.has('data-graph')
        }

        private readonly inner: ElementRenderer

        get element(): HTMLElement | undefined {
            return this.inner.element
        }

        get tagName(): string {
            return this.inner.tagName
        }

        constructor(element: string) {
            this.inner = new LitElementRenderer(element)
        }

        connectedCallback(): void {
            return this.inner.connectedCallback()
        }

        attributeChangedCallback(name: string, old: string | null, value: string | null): void {
            return this.inner.attributeChangedCallback(name, old, value)
        }

        setProperty(name: string, value: unknown): void {
            return this.inner.setProperty(name, value)
        }

        setAttribute(name: string, value: string): void {
            if (name === 'data-graph') {
                usedData.add(value)
                this.inner.setProperty('graph', data[value])
                this.inner.setAttribute(name, value)
                return
            }

            this.inner.setAttribute(name, value)
        }

        get shadowRootOptions(): ShadowRootInit {
            return this.inner.shadowRootOptions
        }

        renderShadow(renderInfo: any): any {
            return this.inner.renderShadow(renderInfo)
        }

        renderLight(renderInfo: any): any {
            return this.inner.renderLight(renderInfo)
        }

        renderAttributes(): any {
            return this.inner.renderAttributes()
        }
    }

    return {
        Renderer,
        usedData,
    }
}

export default ssr
