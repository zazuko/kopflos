import * as fs from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Kopflos, SubjectHandler } from '@kopflos-cms/core'
import render from './lib/ssr.js'
import type { PageRenderer } from './lib/Plugin.js'

export default function (this: Kopflos, templatePath: string, ssrModulePath: string): SubjectHandler {
  const { basePath, buildDir } = this.env.kopflos
  const Plugin = this.getPlugin('@kopflos-labs/pages')!

  return async (req) => {
    const subjectPath = new URL(req.subject.value).pathname

    let html: string
    let renderer: PageRenderer
    if (this.env.kopflos.config.mode === 'development') {
      const viteDevServer = await Plugin.getDevServer(this)
      const template = await fs.readFile(resolve(basePath, Plugin.path, templatePath)).then(buf => buf.toString())
      html = await viteDevServer.transformIndexHtml(subjectPath, template)
      const rendererModule = await viteDevServer.ssrLoadModule(resolve(basePath, Plugin.path, ssrModulePath))
      renderer = rendererModule.default
    } else {
      const outDir = resolve(basePath, buildDir, Plugin.path)
      const clientDir = resolve(outDir, 'client')
      const serverDir = resolve(outDir, 'server')

      html = await fs.readFile(resolve(clientDir, templatePath)).then(buf => buf.toString())
      const rendererModule = await import(resolve(serverDir, ssrModulePath).replace('.ts', '.js'))
      renderer = rendererModule.default
    }

    const body = await render({
      renderer,
      kopflos: this.env.kopflos.config,
      req,
      html,
      options: Plugin.ssrOptions,
    })
    return {
      body,
    }
  }
}
