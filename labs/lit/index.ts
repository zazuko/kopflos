import type { Handler } from '@kopflos-cms/core'
import { render } from '@lit-labs/ssr'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { collectResultSync } from '@lit-labs/ssr/lib/render-result.js'
import { parseDocument } from 'htmlparser2'
import { load } from 'cheerio'

export function ssr(...modules: string[]): Handler {
  return async ({ env }, response) => {
    if (!response) {
      throw new Error('No previous handler in chain')
    }

    const dom = parseDocument(response!.body as string)
    const $ = load(dom)
    const body = $('body')

    const ssrRendered = render(html`${unsafeHTML(body.html())}`)
    body.replaceWith(collectResultSync(ssrRendered))
    return {
      ...response!,
      body: $.html(),
    }
  }
}
