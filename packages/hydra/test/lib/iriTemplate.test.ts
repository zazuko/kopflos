import { parse } from 'node:querystring'
import { hydra, schema, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env-node'
import { expect } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import { fromQuery, applyTemplate } from '../../lib/iriTemplate.js'
import { ex } from '../../../testing-helpers/ns.js'

describe('@kopflos-cms/hydra/lib/iriTemplate.js', () => {
  beforeEach(createStore(import.meta.url, {
    format: 'trig',
    sliceTestPath: [2, -1],
  }))

  describe('fromQuery', () => {
    context('explicit variable representation', () => {
      it('should parse unquoted template variable as named node', async function () {
        // given
        const template = this.rdf.graph.node(ex('query-only/id'))
        const queryString = parse('id=http%3A%2F%2Fwww.hydra-cg.com%2F')

        // when
        const query = fromQuery($rdf, queryString, template)

        // then
        expect(query.out(schema.identifier)).to.deep.eq($rdf.namedNode('http://www.hydra-cg.com/'))
      })

      it('should parse quoted template variable as literal', async function () {
        // given
        const template = this.rdf.graph.node(ex('query-only/find'))
        const queryString = parse('find=%22A%20simple%20string%22')

        // when
        const query = fromQuery($rdf, queryString, template)

        // then
        expect(query.out(hydra.freetextQuery)).to.deep.eq($rdf.literal('A simple string'))
      })

      it('should parse literal with quotes inside', async function () {
        // given
        const template = this.rdf.graph.node(ex('query-only/find'))
        const queryString = parse('find=%22A%20string%20%22%20with%20a%20quote%22')

        // when
        const query = fromQuery($rdf, queryString, template)

        // then
        expect(query.out(hydra.freetextQuery)).to.deep.eq($rdf.literal('A string " with a quote'))
      })

      it('should parse typed literal', async function () {
        // given
        const template = this.rdf.graph.node(ex('query-only/width'))
        const queryString = parse('width=%225.5%22%5E%5Ehttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23decimal')

        // when
        const query = fromQuery($rdf, queryString, template)

        // then
        expect(query.out(schema.width)).to.deep.eq($rdf.literal('5.5', xsd.decimal))
      })

      it('should parse tagged literal', async function () {
        // given
        const template = this.rdf.graph.node(ex('query-only/find'))
        const queryString = parse('find=%22A%20simple%20string%22%40en')

        // when
        const query = fromQuery($rdf, queryString, template)

        // then
        expect(query.out(hydra.freetextQuery)).to.deep.eq($rdf.literal('A simple string', 'en'))
      })

      it('should return individual object for comma-separated query values', async function () {
        // given
        const template = this.rdf.graph.node(ex('query-only/tag'))
        const queryString = parse('tag=http%3A%2F%2Fexample.org%2Fdimension%2Fcolors,http%3A%2F%2Fexample.org%2Fdimension%2Fcountries')

        // when
        const query = fromQuery($rdf, queryString, template)

        // then
        expect(query.out(ex.tag).terms).to.deep.eq([
          $rdf.namedNode('http://example.org/dimension/colors'),
          $rdf.namedNode('http://example.org/dimension/countries'),
        ])
      })

      it('should return individual object for repeated query values', async function () {
        // given
        const template = this.rdf.graph.node(ex('query-only/tag'))
        const queryString = parse('tag=http%3A%2F%2Fexample.org%2Fdimension%2Fcolors&tag=http%3A%2F%2Fexample.org%2Fdimension%2Fcountries')

        // when
        const query = fromQuery($rdf, queryString, template)

        // then
        expect(query.out(ex.tag).terms).to.deep.eq([
          $rdf.namedNode('http://example.org/dimension/colors'),
          $rdf.namedNode('http://example.org/dimension/countries'),
        ])
      })
    })
  })

  describe('applyTemplate', () => {
    context('template is only query params', () => {
      it('sets params to resource', () => {
        // given
        const resource = $rdf.clownface()
          .namedNode('http://example.com/foo/bar')

        // when
        const result = applyTemplate(resource, '?baz=qux')

        // then
        expect(result).to.eq('http://example.com/foo/bar?baz=qux')
      })

      it('replaces existing params', () => {
        // given
        const resource = $rdf.clownface()
          .namedNode('http://example.com/foo?baz=bar')

        // when
        const result = applyTemplate(resource, '?baz=qux')

        // then
        expect(result).to.eq('http://example.com/foo?baz=qux')
      })

      it('combines with existing params', () => {
        // given
        const resource = $rdf.clownface()
          .namedNode('http://example.com/foo?bar=bar')

        // when
        const result = applyTemplate(resource, '?baz=baz')

        // then
        expect(result).to.eq('http://example.com/foo?bar=bar&baz=baz')
      })
    })

    context('template is partial query params', () => {
      it('sets params to resource', () => {
        // given
        const resource = $rdf.clownface()
          .namedNode('http://example.com/foo/bar')

        // when
        const result = applyTemplate(resource, '&baz=qux')

        // then
        expect(result).to.eq('http://example.com/foo/bar?baz=qux')
      })

      it('replaces params', () => {
        // given
        const resource = $rdf.clownface()
          .namedNode('http://example.com/foo?bar=bar')

        // when
        const result = applyTemplate(resource, '&bar=qux')

        // then
        expect(result).to.eq('http://example.com/foo?bar=qux')
      })

      it('combines with other params', () => {
        // given
        const resource = $rdf.clownface()
          .namedNode('http://example.com/foo?bar=bar')

        // when
        const result = applyTemplate(resource, '&baz=qux')

        // then
        expect(result).to.eq('http://example.com/foo?bar=bar&baz=qux')
      })
    })

    context('template is path', () => {
      it('creates a URL from absolute path', () => {
        // given
        const resource = $rdf.clownface()
          .namedNode('http://example.com/foo/bar')

        // when
        const result = applyTemplate(resource, '/baz')

        // then
        expect(result).to.eq('http://example.com/baz')
      })

      it('creates a URL from relative path', () => {
        // given
        const resource = $rdf.clownface()
          .namedNode('http://example.com/foo/bar')

        // when
        const result = applyTemplate(resource, './baz')

        // then
        expect(result).to.eq('http://example.com/foo/baz')
      })
    })
  })
})
