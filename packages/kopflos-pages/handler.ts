import {Kopflos, SubjectHandler} from "@kopflos-cms/core";
import type * as vite from '@kopflos-cms/vite'
import type * as pages from './index.js'
import * as fs from "node:fs/promises";
import { join } from "node:path";
import {parseDocument} from "htmlparser2";
import {load} from "cheerio";

export default function (this: Kopflos, templatePath: string, ssrModulePath: string): SubjectHandler {
    const vite = this.getPlugin('@kopflos-cms/vite')
    const { ssr, path } = this.getPlugin('@kopflos-labs/pages')!

    return async (req) => {
        const {subject, resourceShape, env} = req
        const subjectPath = new URL(subject.value).pathname

        if (!vite?.viteDevServer) {
            throw new Error('Vite dev server not initialized. Check vite plugin configuration.')
        }

        let html: string
        if(vite.viteDevServer.environments.client.mode === 'dev') {
            let template = await fs.readFile(join(path, templatePath)).then(buf => buf.toString())
            const $ = load(parseDocument(template))

            $('head').append(`    
<style>
    body[dsd-pending] {
        display: none;
    }
</style>`)
            $('body')
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

            template = $.html({
                xml: {
                    xmlMode: false,
                },
            })
            html = await vite.viteDevServer.transformIndexHtml(subjectPath, template)
        } else {
            throw new Error('Production mode not implemented yet in kopflos-labs/pages handler.')
        }

        const {default: renderer} = await vite.viteDevServer.ssrLoadModule(ssrModulePath)

        const body = await ssr({
            renderer,
            vite: vite.viteDevServer,
            req,
            html,
        })
        return {
            body
        };
    }
}
