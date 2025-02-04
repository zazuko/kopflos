import { expect } from 'chai'
import $rdf from '@zazuko/env-node'
import { hydra } from '@tpluscode/rdf-ns-builders'
import pageIndexStrategy from '../../../lib/partialCollection/pageIndexStrategy.js'

describe('@kopflos-cms/hydra/lib/partialCollection/pageIndexStrategy.js', () => {
  describe('viewLinksTemplateParams', () => {
    it('skips next when page is last', () => {
      // given
      const collection = $rdf.clownface().blankNode()
        .addOut(hydra.limit, 1)
      const query = $rdf.clownface().blankNode()
        .addOut(hydra.pageIndex, 10)

      // when
      const next = pageIndexStrategy.viewLinksTemplateParams.next({
        collection,
        query,
        totalItems: 10,
      })

      // then
      expect(next).to.be.undefined
    })

    it('skips next when page is beyond last', () => {
      // given
      const collection = $rdf.clownface().blankNode()
        .addOut(hydra.limit, 1)
      const query = $rdf.clownface().blankNode()
        .addOut(hydra.pageIndex, 11)

      // when
      const next = pageIndexStrategy.viewLinksTemplateParams.next({
        collection,
        query,
        totalItems: 10,
      })

      // then
      expect(next).to.be.undefined
    })

    it('skips previous when page is first', () => {
      // given
      const collection = $rdf.clownface().blankNode()
      const query = $rdf.clownface().blankNode()
        .addOut(hydra.pageIndex, 1)

      // when
      const previous = pageIndexStrategy.viewLinksTemplateParams.previous({
        collection,
        query,
        totalItems: 10,
      })

      // then
      expect(previous).to.be.undefined
    })

    it('skips previous when page is below 1', () => {
      // given
      const collection = $rdf.clownface().blankNode()
      const query = $rdf.clownface().blankNode()
        .addOut(hydra.pageIndex, 0)

      // when
      const previous = pageIndexStrategy.viewLinksTemplateParams.previous({
        collection,
        query,
        totalItems: 10,
      })

      // then
      expect(previous).to.be.undefined
    })
  })
})
