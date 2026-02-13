import * as fs from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Kopflos, SubjectHandler } from '@kopflos-cms/core'
import type { GraphPointer } from 'clownface'
import { createLogger } from '@kopflos-cms/logger'

const log = createLogger('template')

export const transform = function (this: Kopflos, path: string): SubjectHandler {
  const vitePlugin = this.getPlugin('@kopflos-cms/vite')

  const prepareDevTemplate = async (subject: GraphPointer, template: string): Promise<string> => {
    if (!vitePlugin) {
      throw new Error('Vite plugin not found. Did you forget to add it to the config?')
    }

    const viteDevServer = await vitePlugin.getDefaultViteDevServer(this.env)

    const subjectPath = new URL(subject.value).pathname
    return viteDevServer.transformIndexHtml(subjectPath, template)
  }

  return async ({ subject, env }, response) => {
    if (env.kopflos.config.mode === 'production') {
      const template = await fs.readFile(resolve(env.kopflos.basePath, env.kopflos.buildDir, path))
      return {
        status: 200,
        body: template.toString(),
        headers: {
          'Content-Type': 'text/html',
        },
      }
    }

    log.debug('Compiling page template')
    const template = await fs.readFile(resolve(env.kopflos.basePath, vitePlugin!.buildConfiguration!.root, path))
    return {
      ...response,
      body: await prepareDevTemplate(subject, template.toString()),
    }
  }
}
