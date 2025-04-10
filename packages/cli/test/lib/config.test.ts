import url from 'node:url'
import { expect } from 'chai'
import { loadConfig, prepareConfig } from '../../lib/config.js'

describe('kopflos/lib/config.js', function () {
  this.timeout(10000)

  describe('loadConfig', function () {
    it('should discover the config file', async function () {
      const { config } = await loadConfig({
        path: undefined,
        root: url.fileURLToPath(new URL('..', import.meta.url)),
      })

      expect(config).to.be.deep.include({
        baseIri: 'https://example.com/',
      })
    })

    it('should load config from path', async function () {
      // given
      const configPath = url.fileURLToPath(new URL('../fixtures/config.json', import.meta.url))

      // when
      const { config } = await loadConfig({
        path: configPath,
      })

      // given
      expect(config).to.be.deep.equal({
        baseIri: 'https://example.com/',
      })
    })
  })

  describe('prepareConfig', function () {
    it('sets config itself as watched paths', async function () {
      // given
      const configPath = url.fileURLToPath(new URL('../fixtures/config.json', import.meta.url))

      // when
      const config = await prepareConfig({
        config: configPath,
        mode: 'development',
        watch: true,
        variable: {},
      })

      // then
      expect(config.watch).to.deep.eq([configPath])
    })

    it('adds config itself to watched paths', async function () {
      // given
      const configPath = url.fileURLToPath(new URL('../fixtures/config.with-watch.json', import.meta.url))

      // when
      const config = await prepareConfig({
        config: configPath,
        mode: 'development',
        watch: true,
        variable: {},
      })

      // then
      expect(config.watch).to.contain.all.members([configPath, 'lib'])
    })

    it('rebase relative plugin paths to config path', async function () {
      // given
      const configPath = url.fileURLToPath(new URL('../fixtures/config.with-relative.json', import.meta.url))

      // when
      const config = await prepareConfig({
        config: configPath,
        mode: 'development',
        watch: true,
        variable: {},
      })

      // then
      expect(config.plugins).to.contain.keys([
        url.fileURLToPath(new URL('../fixtures/foo/bar.js', import.meta.url)),
      ])
    })
  })
})
