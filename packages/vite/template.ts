import type { OutgoingHttpHeaders } from 'node:http'
import type { Kopflos, ResultEnvelope, SubjectHandler } from '@kopflos-cms/core'
import type { GraphPointer } from 'clownface'
import { log } from './lib/log.js'

export const transform = function (this: Kopflos): SubjectHandler {
  const prepareDevTemplate = async (subject: GraphPointer, template: string): Promise<string> => {
    const vite = this.getPlugin('@kopflos-cms/vite')

    if (!vite?.viteDevServer) {
      throw new Error('Vite dev server not initialized. Check vite plugin configuration.')
    }

    const subjectPath = new URL(subject.value).pathname
    return vite.viteDevServer.transformIndexHtml(subjectPath, template)
  }

  return async ({ subject, env }, response) => {
    if (!isHtmlResponse(response)) {
      throw new Error('Vite handler must be chained after another which returns a HTML response')
    }

    if (env.kopflos.config.mode === 'production') {
      return response
    }

    log.debug('Compiling page template')
    return {
      ...response,
      body: await prepareDevTemplate(subject, response.body),
    }
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
