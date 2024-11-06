import { expect } from 'chai'
import rdf from '@zazuko/env-node'
import { toNamedNode } from '../../lib/url.js'

describe('@kopflos-labs/html-template/lib/url.js', () => {
  const ns = rdf.namespace('http://example.org/')

  it('expands relative urls against base', () => {
    expect(toNamedNode(rdf, ns, 'Class')).eq(ns.Class)
  })

  it('keeps absolute URL', () => {
    expect(toNamedNode(rdf, ns, 'http://foo.bar/Baz')).eq(rdf.namedNode('http://foo.bar/Baz'))
  })

  it('expands known prefixed named', () => {
    expect(toNamedNode(rdf, ns, 'schema:Thing')).eq(rdf.ns.schema.Thing)
  })
})
