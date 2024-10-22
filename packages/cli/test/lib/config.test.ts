import url from 'node:url'
import { expect } from 'chai'
import { loadConfig } from '../../lib/config.js'

describe('kopflos/lib/config.js', function () {
  this.timeout(10000)

  describe('loadConfig', () => {
    it('should discover the config file', async () => {
      const config = await loadConfig({
        path: undefined,
        root: url.fileURLToPath(new URL('..', import.meta.url)),
      })

      expect(config).to.be.deep.equal({
        baseIri: 'https://example.com/',
      })
    })

    it('should load config from path', async () => {
      // given
      const configPath = url.fileURLToPath(new URL('../fixtures/config.json', import.meta.url))

      // when
      const config = await loadConfig({
        path: configPath,
      })

      // given
      expect(config).to.be.deep.equal({
        baseIri: 'https://example.com/',
      })
    })
  })
})
