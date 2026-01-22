import { render } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { getWindow } from '@lit-labs/ssr/lib/dom-shim.js'
import { load } from 'cheerio'
import Serializer from '@rdfjs/serializer-rdfjs'
import * as esbuild from 'esbuild';
import {setLanguages} from "@rdfjs-elements/lit-helpers";
import {SsrModule} from "@kopflos-labs/pages";

const serializer = new Serializer();

(globalThis as any).window = <any>getWindow({
    includeJSBuiltIns: true,
})
globalThis.litSsrCallConnectedCallback = (element: any) => {
    return !element.tagName.startsWith('WA-')
}

const ssr: SsrModule = async ({ renderer, vite, html, req, options: ssrOptions }) => {
    const { head, body, data } = await renderer(req)

    setLanguages(...req.headers["accept-language"] || [])

    const $ = load(html)

    if (head) {
        $('head').append(await head())
    }

    if (data) {
        let script = [
            'window.graphs = window.graphs || {};',
            ...Object.entries(data).map(([name, datasetOrPointer]) => {
                const dataset = 'terms' in datasetOrPointer ? datasetOrPointer.dataset : datasetOrPointer
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

    $('body').prepend(await collectResult(render(body(), ssrOptions)))

    return $.html({
        xml: {
            xmlMode: false,
        },
    })
}

export default ssr
