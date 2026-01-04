import {Kopflos, SubjectHandler} from "@kopflos-cms/core";
import type * as vite from '@kopflos-cms/vite'
import type * as pages from './index.js'
import * as fs from "node:fs/promises";

export default function (this: Kopflos, templatePath: string, ssrModulePath: string): SubjectHandler {
    const vite = this.getPlugin('@kopflos-cms/vite')
    const { ssr } = this.getPlugin('@kopflos-labs/pages')!

    return async (req) => {
        const {subject, resourceShape, env} = req
        const subjectPath = new URL(subject.value).pathname

        if (!vite?.viteDevServer) {
            throw new Error('Vite dev server not initialized. Check vite plugin configuration.')
        }

        const template = await fs.readFile(templatePath).then(buf => buf.toString())
        const html = await vite.viteDevServer.transformIndexHtml(subjectPath, template)

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
