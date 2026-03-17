import { expect, use } from 'chai'
import type { ViteDevServer } from 'vite'
import { createServer } from 'vite'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import pagesTransform from '../../lib/vitePlugin.js'

describe('@kopflos-labs/pages/lib/vitePlugin.js', function () {
  use(jestSnapshotPlugin())

  it('should return a vite plugin named pages-transform', function () {
    const plugin = pagesTransform()
    expect(plugin.name).to.equal('pages-transform')
  })

  describe('transformIndexHtml', function () {
    let server: ViteDevServer
    const template = '<html><head></head><body></body></html>'

    afterEach(function () {
      return server?.close()
    })

    it('should add DSD styles and scripts', async function () {
      server = await createServer({
        configFile: false,
        plugins: [pagesTransform()],
      })

      const result = await server.transformIndexHtml('/test.html', template)

      expect(result).toMatchSnapshot()
    })

    it('should not add hydrate script when deferHydration is false', async function () {
      server = await createServer({
        configFile: false,
        plugins: [pagesTransform({ deferHydration: false })],
      })

      const result = await server.transformIndexHtml('/test.html', template)

      expect(result).toMatchSnapshot()
    })
  })
})
