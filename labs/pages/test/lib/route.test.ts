import { expect } from 'chai'
import { toPatterns } from '../../lib/route.js'

describe('@kopflos-labs/pages/lib/route.js', function () {
  describe('toPatterns', function () {
    it('should handle optional variable', function () {
      expect(toPatterns('[[id]].ts').shift()).to.equal('(?<id>[^/]+)?.html$')
    })

    it('should handle required variable', function () {
      expect(toPatterns('[id].ts').shift()).to.equal('(?<id>[^/]+).html$')
    })

    it('should handle catch-all variable', function () {
      expect(toPatterns('[...slug].ts').shift()).to.equal('(?<slug>[/\\w]+).html$')
    })

    it('should handle RegExp constraint', function () {
      expect(toPatterns('[term].ts', { term: /^[a-zA-Z0-9_-]+$/ }).shift()).to.equal('(?<term>[a-zA-Z0-9_-]+).html$')
    })

    it('should handle Dictionary mapping constraint for route and resource', function () {
      const constraints = {
        prefix: { schema: 'http://schema.org/', foaf: 'http://xmlns.com/foaf/0.1/' },
      }
      expect(toPatterns('pages/[prefix]:[term].ts', constraints, 'route').shift()).to.equal('pages/(?<prefix>schema|foaf):(?<term>[^/]+).html$')
      expect(toPatterns('[prefix][term]', constraints, 'resource').shift()).to.equal('(?<prefix>http://schema\\.org/|http://xmlns\\.com/foaf/0\\.1/)(?<term>[^/]+)')
    })

    it('should handle Array constraint', function () {
      expect(toPatterns('[lang].ts', { lang: ['en', 'de', 'fr'] }).shift()).to.equal('(?<lang>en|de|fr).html$')
      expect(toPatterns('[[lang]].ts', { lang: ['en', 'de', 'fr'] as const }).shift()).to.equal('(?<lang>en|de|fr)?.html$')
    })

    it('should return original match if no known variable pattern matches (should not happen with regex)', function () {
      // This is to hit the final return match in replaceAll if somehow regex matches but none of groups are set
      // though with current regex it's impossible.
    })

    describe('index.html', function () {
      it('should match index.html', function () {
        expect(toPatterns('index.ts')).to.deep.equal([
          'index.html$', '$',
        ])
      })
      it('should match nested index.html', function () {
        expect(toPatterns('foo/bar/index.ts')).to.deep.equal([
          'foo/bar/index.html$', 'foo/bar/?$',
        ])
      })
    })
  })
})
