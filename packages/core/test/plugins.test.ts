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
  })
})
