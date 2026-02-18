import { resolve } from 'node:path'
import url from 'node:url'
import { expect } from 'chai'
import { prepareConfig } from '../../lib/config.js'

describe('@kopflos-cms/vite/lib/config.js', function () {
  let root: string
  let appRoot: string

  before(function () {
    appRoot = url.fileURLToPath(new URL('.', import.meta.url))
    root = process.cwd()
  })

  describe('prepareConfig', function () {
    it('returns minimal default config', async function () {
      const config = await prepareConfig({
        appRoot,
        root,
        config: undefined,
        configPath: undefined,
        entrypoints: [],
      })

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

    it('can override out dir relative to cwd', async function () {
      const config = await prepareConfig({
        appRoot,
        root,
        entrypoints: [],
        outDir: 'build',
        config: undefined,
        configPath: undefined,
      })

      expect(config.build.outDir).to.eq(resolve(root, 'build'))
    })

    it('finds input HTMLs from globs and paths', async function () {
      const config = await prepareConfig({
        appRoot,
        root,
        entrypoints: [
          'test/fixtures/foo.html',
          'test/fixtures/ba?.html',
        ],
        config: undefined,
        configPath: undefined,
      })

      expect(config.build.rollupOptions.input).to.contain.all.members([
        resolve(root, 'test/fixtures/foo.html'),
        resolve(root, 'test/fixtures/bar.html'),
        resolve(root, 'test/fixtures/baz.html'),
      ])
    })

    it('merges user config', async function () {
      const config = await prepareConfig({
        appRoot,
        root,
        entrypoints: [],
        config: undefined,
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

    it('loads relative paths resolved against root path', async function () {
      const config = await prepareConfig({
        appRoot,
        root,
        entrypoints: [],
        config: undefined,
        configPath: '../fixtures/vite.config.js',
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
