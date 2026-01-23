import {render} from '@lit-labs/ssr'
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

async function executeQueries(renderer: PageRenderer, queries: QueryMap, env: KopflosEnvironment, subjectVariables: Record<string, string>, queryParams: NodeJS.Dict<string | string[]>): Promise<NonNullable<PageRenderer['data']>> {
    const data: NonNullable<PageRenderer['data']> = renderer.data || {}

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

        const result = await query(params, client, env) as Stream
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

    if (data && Object.keys(data).length > 0) {
        let script = [
            'window.graphs = window.graphs || {};',
            ...Object.entries(data).map(([name, datasetOrPointer]) => {
                const dataset = 'terms' in (datasetOrPointer as AnyPointer) ? (datasetOrPointer as AnyPointer).dataset : datasetOrPointer
                return serializer.transform(dataset as any).replace('export default', `window.graphs.${name} =`);
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

    $('body').prepend(await collectResult(render(body({...req, data}), ssrOptions)))

    return $.html({
        xml: {
            xmlMode: false,
        },
    })
}

export default ssr
