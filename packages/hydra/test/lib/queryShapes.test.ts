import env from '@zazuko/env-node'
import { expect, use } from 'chai'
import snapshots from 'mocha-chai-rdf/snapshots.js'
import { createStore } from 'mocha-chai-rdf/store.js'
import type { DatasetCore } from '@rdfjs/types'
import formatsPretty from '@rdfjs-elements/formats-pretty'
// eslint-disable-next-line import/no-unresolved
import { kl } from '@kopflos-cms/core/ns.js'
import { memberQueryShape, totalsQueryShape } from '../../lib/queryShapes.js'
import { ex } from '../../../testing-helpers/ns.js'

env.formats.import(formatsPretty)

describe('@kopflos-cms/hydra/lib/queryShapes.js', () => {
  use(snapshots)

  beforeEach(createStore(import.meta.url, {
    format: 'trig',
    sliceTestPath: [2, -1],
  }))

  describe('memberQueryShape', () => {
    context('unordered collection', () => {
      it('returns shape without limit or offset', async function () {
        // given
        const collection = this.rdf.graph.namedNode(ex())

        // when
        const shape = memberQueryShape({ env, collection })

        // then
        expect(await serialize(shape.dataset)).toMatchSnapshot()
      })
    })

    context('using member query shape', () => {
      it('ignores :memberShape', async function () {
        // given
        const collection = this.rdf.graph.namedNode(ex())

        // when
        const shape = memberQueryShape({ env, collection })

        // then
        expect(await serialize(shape.dataset)).toMatchSnapshot()
      })
    })

    context('ordered collection', () => {
      it('returns shape with offset', async function () {
        // given
        const collection = this.rdf.graph.namedNode(ex())

        // when
        const shape = memberQueryShape({ env, collection, offset: 5 })

        // then
        expect(await serialize(shape.dataset)).toMatchSnapshot()
      })

      it('returns shape with limit', async function () {
        // given
        const collection = this.rdf.graph.namedNode(ex())

        // when
        const shape = memberQueryShape({ env, collection, limit: 10 })

        // then
        expect(await serialize(shape.dataset)).toMatchSnapshot()
      })

      it('returns shape with limit and offset', async function () {
        // given
        const collection = this.rdf.graph.namedNode(ex())

        // when
        const shape = memberQueryShape({ env, collection, limit: 10, offset: 5 })

        // then
        expect(await serialize(shape.dataset)).toMatchSnapshot()
      })
    })

    context('multiple member assertions', () => {
      it('produces constraint for each', async function () {
        // given
        const collection = this.rdf.graph.namedNode(ex())

        // when
        const shape = memberQueryShape({ env, collection })

        // then
        expect(await serialize(shape.dataset)).toMatchSnapshot()
      })
    })
  })

  describe('totalsQueryShape', () => {
    context('unordered collection', () => {
      it('returns correct total count', async function () {
        // given
        const collection = this.rdf.graph.namedNode(ex())

        // when
        const shape = totalsQueryShape({ env, collection })

        // then
        expect(await serialize(shape.dataset)).toMatchSnapshot()
      })
    })

    context('ordered collection', () => {
      it('returns correct total count', async function () {
        // given
        const collection = this.rdf.graph.namedNode(ex())

        // when
        const shape = totalsQueryShape({ env, collection })

        // then
        expect(await serialize(shape.dataset)).toMatchSnapshot()
      })
    })

    context('multiple member assertions', () => {
      it('returns correct total count', async function () {
        // given
        const collection = this.rdf.graph.namedNode(ex())

        // when
        const shape = totalsQueryShape({ env, collection })

        // then
        expect(await serialize(shape.dataset)).toMatchSnapshot()
      })
    })
  })
})

function serialize(dataset: DatasetCore) {
  return env.dataset.serialize(dataset, {
    format: 'text/turtle',
    prefixes: ['sh', 'hydra', 'schema', 'rdf', ['kl', kl().value]],
    renameBlankNodes: true,
  })
}
