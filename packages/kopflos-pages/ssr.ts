import { render } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { getWindow } from '@lit-labs/ssr/lib/dom-shim.js'
import { parseDocument } from 'htmlparser2'
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
    return element.constructor.__ssrConnectedCallback === true
}

const ssr: SsrModule = async ({ renderer, vite, html, req }) => {
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

        if (vite.config.build.minify && vite.environments.client.mode !== 'dev') {
            script = (await esbuild.transform(script, {
                minify: true
            })).code
        }
        $('head').prepend(`<script type="module">${script}</script>`)
    }

    $('body').prepend(await collectResult(render(body())))

    return $.html({
        xml: {
            xmlMode: false,
        },
    })
}

export default ssr
