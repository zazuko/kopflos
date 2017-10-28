/* global describe, it */

const assert = require('assert')
const ApiObject = require('../lib/ApiObject')

describe('ApiObject', () => {
  it('should be a constructor', () => {
    assert.equal(typeof ApiObject, 'function')
  })

  it('should assign the api options', () => {
    const api = {}

    const apiObject = new ApiObject(api)

    assert.equal(apiObject.api, api)
  })

  it('should assign the api options', () => {
    const iri = {}

    const apiObject = new ApiObject(null, iri)

    assert.equal(apiObject.iri, iri)
  })
})
