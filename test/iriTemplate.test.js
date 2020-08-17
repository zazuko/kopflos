const { strictEqual, deepStrictEqual } = require('assert')
const express = require('express')
const { describe, it } = require('mocha')
const clownface = require('clownface')
const { fromStream } = require('rdf-dataset-ext')
const { hydra, schema, xsd } = require('@tpluscode/rdf-ns-builders')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const request = require('supertest')
const iriTemplateMappingBuilder = require('./support/iriTemplateMappingBuilder')
const middleware = require('../lib/middleware/iriTemplate')

describe('middleware/iriTemplate', () => {
  it('should be a function', () => {
    strictEqual(typeof middleware, 'function')
  })

  it('should return a middleware function', () => {
    const instance = middleware(iriTemplateMappingBuilder({ template: '/' }))

    strictEqual(typeof instance, 'function')
    strictEqual(instance.length, 3)
  })

  it('should do nothing if the template doesn\'t match', async () => {
    let dataset = true
    let quadStream = true
    const app = express()

    app.use(middleware(iriTemplateMappingBuilder({ template: '/test' })))

    app.use((req, res, next) => {
      dataset = req.dataset
      quadStream = req.quadStream

      next()
    })

    await request(app).get('/')

    strictEqual(typeof dataset, 'undefined')
    strictEqual(typeof quadStream, 'undefined')
  })

  it('should add all templates in the dataset', async () => {
    const datasets = {}
    const app = express()

    const { dataset } = iriTemplateMappingBuilder({ template: '/1' })
    iriTemplateMappingBuilder({ dataset, template: '/2' })

    app.use(middleware({ dataset }))

    app.use((req, res, next) => {
      datasets[req.url] = req.dataset

      next()
    })

    await request(app).get('/1')
    await request(app).get('/2')

    strictEqual(typeof datasets['/1'], 'function')
    strictEqual(typeof datasets['/2'], 'function')
  })

  it('should only handle the templates in the given graph', async () => {
    const datasets = {}
    const app = express()

    // create two templates, one in the default graph, the other in a named graph
    const { dataset } = iriTemplateMappingBuilder({ template: '/1' })

    const api = iriTemplateMappingBuilder({
      dataset,
      graph: rdf.namedNode('http://example.org/graph'),
      template: '/2'
    })

    app.use(middleware(api))

    app.use((req, res, next) => {
      datasets[req.url] = req.dataset

      next()
    })

    await request(app).get('/1')
    await request(app).get('/2')

    strictEqual(typeof datasets['/1'], 'undefined')
    strictEqual(typeof datasets['/2'], 'function')
  })

  describe('.dataset', () => {
    it('should attach the method to the request', async () => {
      let dataset = true
      const app = express()

      app.use(middleware(iriTemplateMappingBuilder({ template: '/' })))

      app.use((req, res, next) => {
        dataset = req.dataset

        next()
      })

      await request(app).get('/')

      strictEqual(typeof dataset, 'function')
    })

    it('should return the quads for the mapping via async call', async () => {
      let dataset = null
      const app = express()
      const fromQuad = rdf.quad(rdf.blankNode(), rdf.namedNode('http://example.org/from'), rdf.literal('abc'))
      const toQuad = rdf.quad(rdf.blankNode(), rdf.namedNode('http://example.org/to'), rdf.literal('xyz'))

      app.use(middleware(iriTemplateMappingBuilder({
        template: '/{?from,to}',
        variables: {
          from: 'http://example.org/from',
          to: 'http://example.org/to'
        }
      })))

      app.use(async (req, res, next) => {
        dataset = await req.dataset()

        next()
      })

      await request(app).get('/?from=abc&to=xyz')

      strictEqual(dataset.match(null, fromQuad.predicate, fromQuad.object).size, 1)
      strictEqual(dataset.match(null, toQuad.predicate, toQuad.object).size, 1)
    })

    it('should return individual object for multiple query param occurrences', async () => {
      let dataset = null
      const app = express()
      const tagProp = rdf.namedNode('http://example.org/tag')

      app.use(middleware(iriTemplateMappingBuilder({
        template: '/{?tag*}',
        variables: {
          tag: 'http://example.org/tag'
        }
      })))

      app.use(async (req, res, next) => {
        dataset = await req.dataset()

        next()
      })

      await request(app).get('/?tag=foo&tag=bar')

      strictEqual(dataset.size, 2)
      strictEqual(dataset.match(null, tagProp, rdf.literal('foo')).size, 1)
      strictEqual(dataset.match(null, tagProp, rdf.literal('bar')).size, 1)
    })

    it('should return individual object for comma-separated query values', async () => {
      let dataset = null
      const app = express()
      const tagProp = rdf.namedNode('http://example.org/tag')

      app.use(middleware(iriTemplateMappingBuilder({
        template: '/{?tag}',
        variables: {
          tag: 'http://example.org/tag'
        }
      })))

      app.use(async (req, res, next) => {
        dataset = await req.dataset()

        next()
      })

      await request(app).get('/?tag=foo,bar')

      strictEqual(dataset.size, 2)
      strictEqual(dataset.match(null, tagProp, rdf.literal('foo')).size, 1)
      strictEqual(dataset.match(null, tagProp, rdf.literal('bar')).size, 1)
    })
  })

  describe('.quadStream', () => {
    it('should attach the method to the request', async () => {
      let quadStream = true
      const app = express()

      app.use(middleware(iriTemplateMappingBuilder({ template: '/' })))

      app.use((req, res, next) => {
        quadStream = req.quadStream

        next()
      })

      await request(app).get('/')

      strictEqual(typeof quadStream, 'function')
    })

    it('should return the quads for the mapping via async call', async () => {
      let dataset = null
      const app = express()
      const fromQuad = rdf.quad(rdf.blankNode(), rdf.namedNode('http://example.org/from'), rdf.literal('abc'))
      const toQuad = rdf.quad(rdf.blankNode(), rdf.namedNode('http://example.org/to'), rdf.literal('xyz'))

      app.use(middleware(iriTemplateMappingBuilder({
        template: '/{?from,to}',
        variables: {
          from: 'http://example.org/from',
          to: 'http://example.org/to'
        }
      })))

      app.use(async (req, res, next) => {
        dataset = await fromStream(rdf.dataset(), req.quadStream())

        next()
      })

      await request(app).get('/?from=abc&to=xyz')

      strictEqual(dataset.match(null, fromQuad.predicate, fromQuad.object).size, 1)
      strictEqual(dataset.match(null, toQuad.predicate, toQuad.object).size, 1)
    })
  })

  describe('when template uses explicit representation', () => {
    it('should parse unquoted template variable as named node', async () => {
      // given
      let dataset = null
      const app = express()

      app.use(middleware(iriTemplateMappingBuilder({
        template: '/{?id}',
        variables: {
          id: schema.identifier
        },
        explicitRepresentation: true
      })))

      app.use(async (req, res, next) => {
        dataset = await req.dataset()

        next()
      })

      // when
      await request(app).get('/?id=http%3A%2F%2Fwww.hydra-cg.com%2F')

      // then
      const boundTerm = clownface({ dataset }).out().term
      deepStrictEqual(boundTerm, rdf.namedNode('http://www.hydra-cg.com/'))
    })

    it('should parse quoted template variable as literal', async () => {
      // given
      let dataset = null
      const app = express()

      app.use(middleware(iriTemplateMappingBuilder({
        template: '/{?find}',
        variables: {
          find: hydra.freetextQuery
        },
        explicitRepresentation: true
      })))

      app.use(async (req, res, next) => {
        dataset = await req.dataset()

        next()
      })

      // when
      await request(app).get('/?find=%22A%20simple%20string%22')

      // then
      const boundTerm = clownface({ dataset }).out().term
      deepStrictEqual(boundTerm, rdf.literal('A simple string'))
    })

    it('should parse literal with quotes inside', async () => {
      // given
      let dataset = null
      const app = express()

      app.use(middleware(iriTemplateMappingBuilder({
        template: '/{?find}',
        variables: {
          find: hydra.freetextQuery
        },
        explicitRepresentation: true
      })))

      app.use(async (req, res, next) => {
        dataset = await req.dataset()

        next()
      })

      // when
      await request(app).get('/?find=%22A%20string%20%22%20with%20a%20quote%22')

      // then
      const boundTerm = clownface({ dataset }).out().term
      deepStrictEqual(boundTerm, rdf.literal('A string " with a quote'))
    })

    it('should parse typed literal', async () => {
      // given
      let dataset = null
      const app = express()

      app.use(middleware(iriTemplateMappingBuilder({
        template: '/{?length}',
        variables: {
          length: schema.length
        },
        explicitRepresentation: true
      })))

      app.use(async (req, res, next) => {
        dataset = await req.dataset()

        next()
      })

      // when
      await request(app).get('/?length=%225.5%22%5E%5Ehttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23decimal')

      // then
      const boundTerm = clownface({ dataset }).out().term
      deepStrictEqual(boundTerm, rdf.literal('5.5', xsd.decimal))
    })

    it('should parse tagged literal', async () => {
      // given
      let dataset = null
      const app = express()

      app.use(middleware(iriTemplateMappingBuilder({
        template: '/{?find}',
        variables: {
          find: hydra.freetextQuery
        },
        explicitRepresentation: true
      })))

      app.use(async (req, res, next) => {
        dataset = await req.dataset()

        next()
      })

      // when
      await request(app).get('/?find=%22A%20simple%20string%22%40en')

      // then
      const boundTerm = clownface({ dataset }).out().term
      deepStrictEqual(boundTerm, rdf.literal('A simple string', 'en'))
    })
  })
})
