/* global describe, it */

const assert = require('assert')
const fetch = require('../lib/fetch')

describe('fetch', () => {
  it('should be a function', () => {
    assert.equal(typeof fetch, 'function')
  })

  it('should be a protoFetch', () => {
    assert.equal(typeof fetch.protocols, 'object')
  })

  it('should support file, http and https URLs', () => {
    assert(fetch.protocols.file)
    assert(fetch.protocols.http)
    assert(fetch.protocols.https)
  })
})
