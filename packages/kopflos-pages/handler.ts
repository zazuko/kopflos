import {Kopflos, SubjectHandler} from "@kopflos-cms/core";
import type * as vite from '@kopflos-cms/vite'
import type * as pages from './index.js'
import * as fs from "node:fs/promises";
import { resolve } from "node:path";
import {parseDocument} from "htmlparser2";
import {load} from "cheerio";

export default function (this: Kopflos, templatePath: string, ssrModulePath: string): SubjectHandler {
    const vite = this.getPlugin('@kopflos-cms/vite')
    const { basePath } = this.env.kopflos
    const { ssr, ssrOptions } = this.getPlugin('@kopflos-labs/pages')!

    return async (req) => {
        const {subject, resourceShape, env} = req
        const subjectPath = new URL(subject.value).pathname

        let html: string
        let renderer: any
        if (vite?.viteDevServer && vite.viteDevServer.environments.client.mode === 'dev') {
            let template = await fs.readFile(resolve(basePath, templatePath)).then(buf => buf.toString())
            const $ = load(parseDocument(template))

            $('head').append(`    
<style>
    body[dsd-pending] {
        display: none;
    }
</style>`)
            const body = $('body')

            body
                .attr('dsd-pending', '')
                .prepend(`
<script>
    if (HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) {
        // This browser has native declarative shadow DOM support, so we can
        // allow painting immediately.
        document.body.removeAttribute('dsd-pending')
    }
</script>
<script type="module">
    import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
</script>`).append(`
<script type="module">
    import '@kopflos-labs/pages/shadow.js'
</script>`)

            if(ssrOptions?.deferHydration) {
                body.append(`
<script type="module">
    import '@kopflos-labs/pages/runtime/hydrate.js';
</script>
                `)
            }

            template = $.html({
                xml: {
                    xmlMode: false,
                },
            })
            html = await vite.viteDevServer.transformIndexHtml(subjectPath, template)
            const rendererModule = await vite.viteDevServer.ssrLoadModule(resolve(basePath, ssrModulePath))
            renderer = rendererModule.default
        } else {
            const outDir = resolve(basePath, 'dist')
            const clientDir = resolve(outDir, 'client')
            const serverDir = resolve(outDir, 'server')

            html = await fs.readFile(resolve(clientDir, templatePath)).then(buf => buf.toString())
            const rendererModule = await import(resolve(serverDir, ssrModulePath).replace('.ts', '.js'))
            renderer = rendererModule.default
        }

        const body = await ssr({
            renderer,
            vite: vite?.viteDevServer,
            req,
            html,
            options: ssrOptions
        })
        return {
            body
        };
    }
}
