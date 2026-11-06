import * as fs from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Kopflos, SubjectHandler } from '@kopflos-cms/core'
import { log } from '@kopflos-cms/core'
import render from './lib/ssr.js'
import type { Page } from './lib/Plugin.js'
import { validateConstraints } from './lib/constraints.js'

const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<body></body>
</html>`

export default function (this: Kopflos, modulePath: string): SubjectHandler {
  const { basePath, buildDir } = this.env.kopflos
  const Plugin = this.getPlugin('@kopflos-labs/pages')!
  const templatePath = modulePath.replace(/.(ts|js)$/, '.html')
  const serverPath = modulePath.replace(/.(ts|js)$/, '.html.$1')

  return async (req) => {
    const isDev = this.env.kopflos.config.mode === 'development'

    let loadModule: (path: string) => Promise<{ default: Page }>
    let pageModulePath: string
    let templateFile: string
    let serverModulePath: string
    let transformHtml: (rawHtml: string) => Promise<string>

    if (isDev) {
      const viteDevServer = await Plugin.getDevServer(this)
      loadModule = path => viteDevServer.ssrLoadModule(path) as Promise<{ default: Page }>
      pageModulePath = resolve(basePath, Plugin.path, modulePath)
      templateFile = resolve(basePath, Plugin.path, templatePath)
      serverModulePath = resolve(basePath, Plugin.path, serverPath)
      transformHtml = (template) => {
        let subjectPath = new URL(req.subject.value).pathname
        if (templateFile.endsWith('index.html')) {
          subjectPath = subjectPath.replace(/\/?$/, '/index.html')
        }
        return viteDevServer.transformIndexHtml(subjectPath, template, templateFile)
      }
    }
    else {
      const outDir = resolve(basePath, buildDir, Plugin.path)
      const clientDir = resolve(outDir, 'client')
      const serverDir = resolve(outDir, 'server')

      loadModule = path => import(path)
      pageModulePath = resolve(serverDir, modulePath).replace('.ts', '.js')
      templateFile = resolve(clientDir, templatePath)
      serverModulePath = resolve(serverDir, serverPath).replace('.ts', '.js')
      transformHtml = async template => template
    }

    const pageModule = await loadModule(pageModulePath)
    const page: Page = pageModule.default

    if (page.constraints && !validateConstraints(page.constraints, req.subjectVariables)) {
      return {
        status: 404,
      }
    }

    const template = await fs.readFile(templateFile)
      .then(buf => buf.toString())
      .catch(() => fallbackHtml)

    const html = await transformHtml(template)

    await fs.access(serverModulePath)
      .then(() => loadModule(serverModulePath))
      .catch(() => {
        log.debug(`Server module not found: ${serverModulePath}`)
      })

    const body = await render({
      page,
      mode: this.env.kopflos.config.mode,
      req,
      html,
      options: Plugin.ssrOptions,
    })
    return {
      body,
    }
  }
}
