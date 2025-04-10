import { expect } from 'chai'
import rdf from '@zazuko/env-node'
import { toNamedNode } from '../../lib/url.js'

describe('@kopflos-labs/html-template/lib/url.js', function () {
  const ns = rdf.namespace('http://example.org/')

  it('expands relative urls against base', function () {
    expect(toNamedNode(rdf, ns, 'Class')).eq(ns.Class)
  })

  it('keeps absolute URL', function () {
    expect(toNamedNode(rdf, ns, 'http://foo.bar/Baz')).eq(rdf.namedNode('http://foo.bar/Baz'))
  })

  it('expands known prefixed named', function () {
    expect(toNamedNode(rdf, ns, 'schema:Thing')).eq(rdf.ns.schema.Thing)
  })
})
