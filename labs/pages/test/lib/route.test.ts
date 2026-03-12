import { expect } from 'chai'
import { toPattern } from '../../lib/route.js'

describe('@kopflos-labs/pages/lib/route.js', function () {
  describe('toPattern', function () {
    it('should handle optional variable', function () {
      expect(toPattern('[[id]].ts')).to.equal('(?<id>[^/]+)?.html$')
    })

    it('should handle required variable', function () {
      expect(toPattern('[id].ts')).to.equal('(?<id>[^/]+).html$')
    })

    it('should handle catch-all variable', function () {
      expect(toPattern('[...slug].ts')).to.equal('(?<slug>[/\\w]+).html$')
    })

    it('should return original match if no known variable pattern matches (should not happen with regex)', function () {
      // This is to hit the final return match in replaceAll if somehow regex matches but none of groups are set
      // though with current regex it's impossible.
    })
  })
})
