import $rdf from '@zazuko/env-node'
import { expect, use } from 'chai'
import snapshots from 'mocha-chai-rdf/snapshots.js'
import { createStore } from 'mocha-chai-rdf/store.js'
import { prepareMember } from '../../lib/collection.js'
import { ex } from '../../../testing-helpers/ns.js'

describe('@kopflos-cms/hydra/lib/collection.js', () => {
  use(snapshots)

  before(createStore(import.meta.url))

  describe('prepareMember', () => {
    it('asserts all combinations of member assertions', function () {
      // given
      const collection = this.rdf.graph.node(ex.collection)

      const newMember = $rdf.clownface().blankNode()
      const memberId = ex.item

      // when
      const member = prepareMember($rdf, collection, newMember, memberId)

      // then
      expect(member.dataset).canonical.toMatchSnapshot()
    })

    it('skips invalid member assertions', function () {
      // given
      const collection = this.rdf.graph.node(ex.invalidMemberAssertions)

      const newMember = $rdf.clownface().blankNode()
      const memberId = ex.item

      // when
      const member = prepareMember($rdf, collection, newMember, memberId)

      // then
      expect(member.dataset.size).to.eq(0)
    })
  })
})
