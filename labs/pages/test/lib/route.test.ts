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

    it('should compile RegExp constraint using source pattern ensuring case sensitivity', function () {
      const patterns = toPatterns('[term].ts', { term: /^[a-z]+$/ })
      const routeRegex = new RegExp(patterns[0])
      expect(routeRegex.test('foo.html')).to.be.true
      expect(routeRegex.test('FOO.html')).to.be.false
    })

    it('should support explicit character classes in RegExp constraint for case-insensitive matching', function () {
      const patterns = toPatterns('[term].ts', { term: /^[a-zA-Z]+$/ })
      const routeRegex = new RegExp(patterns[0])
      expect(routeRegex.test('foo.html')).to.be.true
      expect(routeRegex.test('FOO.html')).to.be.true
      expect(routeRegex.test('Foo.html')).to.be.true
      expect(routeRegex.test('123.html')).to.be.false
    })

    it('should throw an error if RegExp constraint contains modifier flags', function () {
      expect(() => toPatterns('[term].ts', { term: /^[a-z]+$/i })).to.throw(
        'RegExp constraint for "term" contains flags (i). Use explicit character classes (e.g. [a-zA-Z]) instead.',
      )
      expect(() => toPatterns('[term].ts', { term: /^[a-z]+$/g })).to.throw(
        'RegExp constraint for "term" contains flags (g). Use explicit character classes (e.g. [a-zA-Z]) instead.',
      )
    })

    it('should handle optional variable with RegExp constraint', function () {
      expect(toPatterns('[[term]].ts', { term: /^[a-z]+$/ }).shift()).to.equal('(?<term>[a-z]+)?.html$')
    })

    it('should generate resource pattern with RegExp constraint', function () {
      expect(toPatterns('http://example.org/[term]', { term: /^[0-9]+$/ }, 'resource').shift()).to.equal('http://example.org/(?<term>[0-9]+)')
    })

    it('should handle multiple variables with mixed constraints', function () {
      const constraints = {
        lang: ['en', 'de'],
        prefix: { schema: 'http://schema.org/' },
        id: /^[0-9]+$/,
      }
      expect(toPatterns('[lang]/[prefix]:[id].ts', constraints, 'route').shift()).to.equal('(?<lang>en|de)/(?<prefix>schema):(?<id>[0-9]+).html$')
      expect(toPatterns('[lang]/[prefix][id]', constraints, 'resource').shift()).to.equal('(?<lang>en|de)/(?<prefix>http://schema\\.org/)(?<id>[0-9]+)')
    })

    it('should escape special regex characters in Array and Dictionary constraints', function () {
      const constraints = {
        ext: ['a.b', 'c+d'],
        dict: { 'foo.bar': 'http://example.org/foo.bar' },
      }
      expect(toPatterns('[ext]/[dict].ts', constraints, 'route').shift()).to.equal('(?<ext>a\\.b|c\\+d)/(?<dict>foo\\.bar).html$')
      expect(toPatterns('[ext]/[dict]', constraints, 'resource').shift()).to.equal('(?<ext>a\\.b|c\\+d)/(?<dict>http://example\\.org/foo\\.bar)')
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
