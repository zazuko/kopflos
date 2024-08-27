import { Readable } from 'node:stream'
import { expect } from 'chai'
import sinon from 'sinon'
import rdf from '@zazuko/env-node'
import { BodyWrapper } from '../BodyWrapper.js'
import { ex } from '../../testing-helpers/ns.js'

describe('BodyWrapper', () => {
  describe('.dataset', () => {
    it('consumes stream only once', async () => {
      // given
      const quadStream = sinon.stub().returns(rdf.dataset().toStream())
      const req = new (class extends Readable {
        quadStream = quadStream
      })()
      const body = new BodyWrapper(rdf, ex.foo, req)

      // when
      await body.dataset
      await body.dataset

      // then
      expect(quadStream).to.have.been.calledOnce
    })
  })

  describe('.pointer', () => {
    it('consumes stream only once', async () => {
      // given
      const quadStream = sinon.stub().returns(rdf.dataset().toStream())
      const req = new (class extends Readable {
        quadStream = quadStream
      })()
      const body = new BodyWrapper(rdf, ex.foo, req)

      // when
      await body.pointer()
      await body.pointer()

      // then
      expect(quadStream).to.have.been.calledOnce
    })
  })
})
