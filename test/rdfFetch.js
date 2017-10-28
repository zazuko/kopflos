/* global describe, it */

const assert = require('assert')
const rdfFetch = require('../lib/rdfFetch')

describe('rdfFetch', () => {
  it('should be a function', () => {
    assert.equal(typeof rdfFetch, 'function')
  })
})
