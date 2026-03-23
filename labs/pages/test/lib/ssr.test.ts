import type { HandlerArgs, KopflosEnvironment } from '@kopflos-cms/core'
import { expect } from 'chai'
import { html } from 'lit'
import type { ViteDevServer } from 'vite'
import { createServer } from 'vite'
import { createEnv } from '@kopflos-cms/core/env.js'
import { streamClient, parsingClient } from 'mocha-chai-rdf/sparql-clients.js'
import { createEmpty } from 'mocha-chai-rdf/store.js'
import ssr from '../../lib/ssr.js'
import type { Page } from '../../lib/Plugin.js'

describe('ssr', function () {
  let env: KopflosEnvironment
  let req: HandlerArgs
  let vite: ViteDevServer

  beforeEach(createEmpty)

  beforeEach(function () {
    env = createEnv({
      baseIri: 'https://example.org/',
      sparql: {
        default: {
          stream: streamClient(this.rdf.store),
          parsed: parsingClient(this.rdf.store),
        },
      },
    }, process.cwd())
    req = {
      env,
      headers: {},
      query: {},
      subjectVariables: {},
    } as HandlerArgs

    // Patch executeQuery to avoid the pipe issue if the above mock is not enough
    // Actually, the issue is that executeQuery is imported from ./pageData.js
    // and it uses its own env.
  })

  before(async function () {
    vite = await createServer({
      root: import.meta.dirname,
    })
    await vite.listen()
  })

  after(async function () {
    await vite?.close()
  })

  it('renders a simple page', async function () {
    // given
    const page: Page = {
      body: () => html`<div>Hello World</div>`,
      queries: {},
    }
    const template = '<html><body></body></html>'

    // when
    const result = await ssr({
      mode: 'development',
      page,
      html: template,
      req,
      options: {},
    })

    // then
    expect(result).to.contain('<div>Hello World</div>')
  })

  it('renders head content', async function () {
    // given
    const page: Page = {
      head: '<title>Test Page</title>',
      body: () => html`<div>Body</div>`,
      queries: {},
    }
    const template = '<html><head></head><body></body></html>'

    // when
    const result = await ssr({
      mode: 'development',
      page,
      html: template,
      req,
      options: {},
    })

    // then
    expect(result).to.contain('<title>Test Page</title>')
  })

  it('renders head content from function', async function () {
    // given
    const page = (await vite.ssrLoadModule('../fixtures/pages/ssr-head.js')).default
    const template = '<html><head></head><body></body></html>'

    // when
    const result = await ssr({
      mode: 'development',
      page,
      html: template,
      req,
      options: {},
    })

    // then
    expect(result).to.contain('<title>Bar</title>')
  })

  it('injects data into head as script when used in body', async function () {
    // given
    const page = (await vite.ssrLoadModule('../fixtures/pages/ssr-fooPage.js')).default
    const template = '<html><head></head><body></body></html>'

    // when
    const result = await ssr({
      mode: 'development',
      page,
      html: template,
      req,
      options: {},
    })

    // then
    expect(result).to.contain('window.graphs.foo =')
    expect(result).to.contain('Bar')
  })

  it('calls connectedCallback by default', async function () {
    // given
    const page = (await vite.ssrLoadModule('../fixtures/pages/ssr-connectedCallback.js')).default

    const template = '<html><body></body></html>'

    // when
    const result = await ssr({
      mode: 'development',
      page,
      html: template,
      req,
    })

    // then
    expect(result.replace(/<!--[\s\S]*?-->/g, '')).to.contain('Connected: true')
  })

  it('minifies script in production mode', async function () {
    // given
    const page = (await vite.ssrLoadModule('../fixtures/pages/ssr-fooPage.js')).default
    const template = '<html><head></head><body></body></html>'

    // when
    const result = await ssr({
      mode: 'production',
      page,
      html: template,
      req,
      options: {},
    })

    // then
    expect(result).to.contain('window.graphs.foo=') // minified (no spaces)
  })
})
