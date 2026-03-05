import * as chai from 'chai'
import env from '@zazuko/env-node'
import { createStore } from 'mocha-chai-rdf/store.js'
import selectQuery from '../../queries/page-patterns.rq'

const { expect } = chai

describe('labs/pages/queries/page-patterns.rq', function () {
  beforeEach(createStore(import.meta.url, { format: 'trig' }))

  it('should return the expected bindings', async function () {
    // given
    const client = this.rdf.parsingClient

    // when
    const results = await selectQuery({ client, env })

    // then
    expect(results).to.have.length(1)
    expect(results[0].resourcePattern).to.equal(env.literal('^http://example.org/resource/(?<id>.+)$'))
    expect(results[0].pagePattern).to.equal(env.literal('http://example.org/page/(?<id>.+)'))
  })
})
