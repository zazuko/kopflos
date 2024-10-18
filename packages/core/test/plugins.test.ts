import url from 'node:url'
import { expect } from 'chai'
import { loadPlugins } from '../plugins.js'

describe('@kopflos-cms/core/plugins.js', () => {
  describe('loadPlugins', () => {
    it('includes default plugins', async () => {
      // when
      const plugins = await loadPlugins({})

      // then
      expect(plugins).to.have.length(1)
    })

    it('can explicitly disable plugins', async () => {
      // when
      const plugins = await loadPlugins({
        '@kopflos-cms/core/plugin/shorthandTerms.js': false,
      })

      // then
      expect(plugins).to.have.length(0)
    })

    it('allows referencing named exports', async () => {
      // given
      const pluginPath = url.fileURLToPath(
        new URL('./support/plugin.js', import.meta.url),
      ) + '#namedPlugin'

      // when
      const plugins = await loadPlugins({
        [pluginPath]: 'foobar',
      })

      // then
      expect(plugins[1]).to.have.property('name', 'foobar')
    })
  })
})
