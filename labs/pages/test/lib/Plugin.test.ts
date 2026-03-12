import { expect, use } from 'chai'
import type { Kopflos, KopflosEnvironment } from '@kopflos-cms/core'
import { createEnv } from '@kopflos-cms/core/env.js' // eslint-disable-line import/no-extraneous-dependencies
import snapshots from 'mocha-chai-rdf/snapshots.js'
import type { Dataset } from '@zazuko/env/lib/DatasetExt.js'
import formatsPretty from '@rdfjs-elements/formats-pretty'
import PagesPlugin from '../../lib/Plugin.js'

describe('@kopflos-cms/pages/lib/Plugin.js', function () {
  let env: KopflosEnvironment

  before(function () {
    use(snapshots)
  })

  beforeEach(function () {
    env = createEnv({
      baseIri: 'https://example.org/',
      sparql: {
        default: 'https://example.org/sparql',
      },
    }, process.cwd())

    env.formats.import(formatsPretty)
  })

  describe('apiGraphs', function () {
    it('should return kopflos pages graph', function () {
      // given
      const plugin = new PagesPlugin({})
      const kopflos = {
        env,
      } as unknown as Kopflos

      // when
      const graphs = plugin.apiGraphs(kopflos)

      // then
      expect(graphs).to.contain('https://kopflos.described.at/Pages')
    })
  })

  describe('deployedResources', function () {
    it('should generate resource shapes for pages', async function () {
      // given
      const plugin = new PagesPlugin({
        path: 'test/fixtures/pages',
      })

      // when
      const dataset = await plugin.deployedResources(env) as Dataset

      // then
      expect(await dataset.serialize({ format: 'text/turtle' })).toMatchSnapshot()
    })
  })

  describe('watchPaths', function () {
    it('should return configured path', function () {
      // given
      const plugin = new PagesPlugin({
        path: 'my-pages',
      })

      // when
      const paths = plugin.watchPaths()

      // then
      expect(paths).to.contain('my-pages')
    })
  })
})
