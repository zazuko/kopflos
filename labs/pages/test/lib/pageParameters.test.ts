import { expect } from 'chai'
import { fillTemplate } from '../../lib/pageParameters.js'

describe('@kopflos-labs/pages/lib/pageParameters', function () {
  describe('fillTemplate', function () {
    it('should return null if not all variables are provided', function () {
      const pattern = 'https://example.com/[id]/[name]'
      const variables = { id: '123' }
      const result = fillTemplate(pattern, variables)
      expect(result).to.be.null
    })

    it('should fill all variables and return the string', function () {
      const pattern = 'https://example.com/[id]/[name]'
      const variables = { id: '123', name: 'test' }
      const result = fillTemplate(pattern, variables)
      expect(result).to.equal('https://example.com/123/test')
    })

    it('should return the original string if no variables are in pattern', function () {
      const pattern = 'https://example.com/page'
      const variables = { id: '123' }
      const result = fillTemplate(pattern, variables)
      expect(result).to.equal('https://example.com/page')
    })

    it('should handle variables with underscores and numbers', function () {
      const pattern = 'https://example.com/[user_123]/[profile_id]'
      const variables = { user_123: 'john', profile_id: '456' }
      const result = fillTemplate(pattern, variables)
      expect(result).to.equal('https://example.com/john/456')
    })

    it('should handle multiple occurrences of the same variable (if it worked before)', function () {
      const pattern = 'https://example.com/[id]/[id]'
      const variables = { id: '123' }
      const result = fillTemplate(pattern, variables)
      // Current implementation:
      // variables = ['id', 'id']
      // for v of variables:
      //   iri = iri.replace('[id]', '123') // replaces FIRST occurrence
      //   iri = iri.replace('[id]', '123') // replaces SECOND occurrence (now it is the first)
      // So it should work.
      expect(result).to.equal('https://example.com/123/123')
    })
  })
})
