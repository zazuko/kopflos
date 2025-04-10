import rdf from '@zazuko/env-node'
import { hydra } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import limitOffsetStrategy from '../../../lib/partialCollection/limitOffsetStrategy.js'

describe('@kopflos-cms/hydra/lib/partialCollection/limitOffsetStrategy.js', function () {
  it('defaults hydra:limit to value from collection itself', function () {
    // given
    const query = rdf.clownface().blankNode()
    const collection = rdf.clownface()
      .blankNode()
      .addOut(hydra.limit, 10)

    // when
    const { limit } = limitOffsetStrategy.getLimitOffset({
      query,
      collection,
    })

    // then
    expect(limit).to.eq(10)
  })

  it('overrides hydra:limit from query', function () {
    // given
    const query = rdf.clownface()
      .blankNode()
      .addOut(hydra.limit, 20)
      .addOut(hydra.offset, 30)
    const collection = rdf.clownface()
      .blankNode()
      .addOut(hydra.limit, 10)

    // when
    const { limit, offset } = limitOffsetStrategy.getLimitOffset({
      query,
      collection,
    })

    // then
    expect(limit).to.eq(20)
    expect(offset).to.eq(30)
  })
})
