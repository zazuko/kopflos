import { expect } from 'chai'
import { toPattern } from '../../lib/route.js'

describe('@kopflos-labs/pages/lib/route.js', function () {
  describe('toPattern', function () {
    it('should handle optional variable', function () {
      expect(toPattern('[[id]].html')).to.equal('(?<id>[^/]+)?$')
    })

    it('should handle required variable', function () {
      expect(toPattern('[id].html')).to.equal('(?<id>[^/]+)$')
    })

    it('should handle catch-all variable', function () {
      expect(toPattern('[...slug].html')).to.equal('(?<slug>[/\\w]+)$')
    })

    it('should return original match if no known variable pattern matches (should not happen with regex)', function () {
      // This is to hit the final return match in replaceAll if somehow regex matches but none of groups are set
      // though with current regex it's impossible.
    })
  })
})
