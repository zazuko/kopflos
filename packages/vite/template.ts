import type { OutgoingHttpHeaders } from 'node:http'
import type { KopflosEnvironment, ResultEnvelope, SubjectHandler } from '@kopflos-cms/core'
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

export const transform = (): SubjectHandler => async ({ subject, env }, response) => {
  if (!isHtmlResponse(response)) {
    throw new Error('Vite handler must be chained after another which returns a HTML response')
  }

  if (env.kopflos.config.mode === 'production') {
    return response
  }

  log.debug('Compiling page template')
  return {
    ...response,
    body: await prepareDevTemplate(env, subject, response.body),
  }
}

function isHtmlResponse(response: ResultEnvelope | undefined): response is ResultEnvelope & { body: string } {
  return typeof response?.body === 'string' || hasHeader(response?.headers, 'Content-Type', 'text/html')
}

function hasHeader(headers: OutgoingHttpHeaders | undefined, headerName: string, headerValue: string): boolean {
  const normalizedHeaderName = headerName.toLowerCase()
  return !!headers && Object.entries(headers)
    .some(([key, value]) => {
      return key.toLowerCase() === normalizedHeaderName && (value === headerValue || (Array.isArray(value) && value.includes(headerValue)))
    })
}
