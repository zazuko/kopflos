import { IncomingMessage } from 'node:http'
import { expect } from 'chai'
import sinon from 'sinon'
import rdf from '@zazuko/env-node'
import type { Request } from 'express'
import { BodyWrapper } from '../BodyWrapper.js'
import { ex } from '../../testing-helpers/ns.js'

describe('BodyWrapper', function () {
  class FakeRequest extends IncomingMessage {
    get quadStream(): Pick<Request, 'quadStream'>['quadStream'] {
      return this._quadStream
    }

    set quadStream(value: Pick<Request, 'quadStream'>['quadStream']) {
      this._quadStream = value
    }

    private declare _quadStream: Pick<Request, 'quadStream'>['quadStream']
  }

  describe('.dataset', function () {
    it('consumes stream only once', async function () {
      // given
      const quadStream = sinon.stub().returns(rdf.dataset().toStream())
      const req = sinon.createStubInstance(FakeRequest, { quadStream })
      const body = new BodyWrapper(rdf, ex.foo, req)

      // when
      await body.dataset
      await body.dataset

      // then
      expect(quadStream).to.have.been.calledOnce
    })
  })

  describe('.pointer', function () {
    it('consumes stream only once', async function () {
      // given
      const quadStream = sinon.stub().returns(rdf.dataset().toStream())
      const req = sinon.createStubInstance(FakeRequest, { quadStream })
      const body = new BodyWrapper(rdf, ex.foo, req)

      // when
      await body.pointer()
      await body.pointer()

      // then
      expect(quadStream).to.have.been.calledOnce
    })
  })
})
