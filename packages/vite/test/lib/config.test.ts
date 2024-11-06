import { resolve } from 'node:path'
import { expect } from 'chai'
import { prepareConfig } from '../../lib/config.js'

describe('@kopflos-cms/vite/lib/config.js', () => {
  describe('prepareConfig', () => {
    it('returns minimal default config', async () => {
      const config = await prepareConfig({})

      expect(config).to.deep.contain({
        server: {
          middlewareMode: true,
        },
        appType: 'custom',
        build: {
          emptyOutDir: true,
        },
      })
    })

    it('can override out dir relative to cwd', async () => {
      const config = await prepareConfig({
        outDir: 'build',
      })

      expect(config.build.outDir).to.eq(resolve(process.cwd(), 'build'))
    })

    it('finds input HTMLs from globs and paths', async () => {
      const config = await prepareConfig({
        entrypoints: [
          'test/fixtures/foo.html',
          'test/fixtures/ba?.html',
        ],
      })

      expect(config.build.rollupOptions.input).to.contain.all.members([
        'test/fixtures/foo.html',
        'test/fixtures/bar.html',
        'test/fixtures/baz.html',
      ])
    })

    it('merges user config', async () => {
      const config = await prepareConfig({
        configPath: '@kopflos-cms/vite/test/fixtures/vite.config.js',
      })

      delete config.build.outDir

      expect(config).to.deep.contain({
        define: {
          APP_VERSION: 'v1.0.0',
        },
        server: {
          middlewareMode: true,
        },
        appType: 'custom',
        build: {
          emptyOutDir: true,
        },
      })
    })
  })
})
