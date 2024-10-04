import type { KopflosEnvironment, SubjectHandler } from '@kopflos-cms/core'
import type { GraphPointer } from 'clownface'
import { createViteServer } from './lib/server.js'
import { log } from './lib/log.js'
import type { Options } from './index.js'

async function prepareDevTemplate(env: KopflosEnvironment, subject: GraphPointer, template: string): Promise<string> {
  const config = env.kopflos.config.plugins?.['@kopflos-cms/vite'] as Options | undefined

  const vite = await createViteServer(config || {})

  const subjectPath = new URL(subject.value).pathname
  return vite.transformIndexHtml(subjectPath, template)
}

export const transform: SubjectHandler = async ({ subject, env }) => {
  if (!response) {
    throw new Error('Vite handler must be chained after another which returns a HTML response')
  }

  if (!isHtmlResponse(response)) {
    return response
  }

  if (process.env.DEV_UI !== 'true') {
    return response
  }

  log.debug('Compiling page template')
  return {
    ...response,
    body: await prepareDevTemplate(env, subject, response.body),
  }
}
