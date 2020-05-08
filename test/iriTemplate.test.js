const { strictEqual } = require('assert')
const express = require('express')
const { describe, it } = require('mocha')
const { fromStream } = require('rdf-dataset-ext')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const namespace = require('@rdfjs/namespace')
const TermSet = require('@rdfjs/term-set')
const request = require('supertest')
const iriTemplateMappingBuilder = require('./support/iriTemplateMappingBuilder')
const { absolute, relative } = require('../lib/middleware/iriTemplate')

const ex = namespace('http://example.org/')

describe('middleware/iriTemplate', () => {
  describe('absolute', () => {
    it('should be a function', () => {
      strictEqual(typeof absolute, 'function')
    })

    it('should return a middleware function', () => {
      const instance = absolute(iriTemplateMappingBuilder({ template: '/' }))

      strictEqual(typeof instance, 'function')
      strictEqual(instance.length, 3)
    })

    it('should do nothing if the template doesn\'t match', async () => {
      let dataset = true
      let quadStream = true
      const app = express()

      app.use(absolute(iriTemplateMappingBuilder({ template: '/test' })))

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

      const { dataset } = iriTemplateMappingBuilder({
        template: '/1{?test}',
        variables: {
          test: ex.test
        }
      })

      iriTemplateMappingBuilder({
        dataset,
        template: '/2{?test}',
        variables: {
          test: ex.test
        }
      })

      app.use(absolute({ dataset }))

      app.use((req, res, next) => {
        datasets[req.url] = req.dataset

        next()
      })

      await request(app).get('/1?test=1')
      await request(app).get('/2?test=2')

      strictEqual(typeof datasets['/1?test=1'], 'function')
      strictEqual(typeof datasets['/2?test=2'], 'function')
    })

    it('should only handle the templates in the given graph', async () => {
      const datasets = {}
      const app = express()

      // create two templates, one in the default graph, the other in a named graph
      const { dataset } = iriTemplateMappingBuilder({
        template: '/1{?test}',
        variables: {
          test: ex.test
        }
      })

      const api = iriTemplateMappingBuilder({
        dataset,
        graph: ex.graph,
        template: '/2{?test}',
        variables: {
          test: ex.test
        }
      })

      app.use(absolute(api))

      app.use((req, res, next) => {
        datasets[req.url] = req.dataset

        next()
      })

      await request(app).get('/1?test=1')
      await request(app).get('/2?test=2')

      strictEqual(typeof datasets['/1?test=1'], 'undefined')
      strictEqual(typeof datasets['/2?test=2'], 'function')
    })

    describe('.dataset', () => {
      it('should attach the method to the request', async () => {
        let dataset = true
        const app = express()

        app.use(absolute(iriTemplateMappingBuilder({
          template: '/{?test}',
          variables: {
            test: ex.test
          }
        })))

        app.use((req, res, next) => {
          dataset = req.dataset

          next()
        })

        await request(app).get('/?test=1')

        strictEqual(typeof dataset, 'function')
      })

      it('should return the quads for the mapping via async call', async () => {
        let dataset = null
        const app = express()
        const fromQuad = rdf.quad(rdf.blankNode(), ex.from, rdf.literal('abc'))
        const toQuad = rdf.quad(rdf.blankNode(), ex.to, rdf.literal('xyz'))

        app.use(absolute(iriTemplateMappingBuilder({
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
    })

    describe('.quadStream', () => {
      it('should attach the method to the request', async () => {
        let quadStream = true
        const app = express()

        app.use(absolute(iriTemplateMappingBuilder({
          template: '/{?test}',
          variables: {
            test: ex.test
          }
        })))

        app.use((req, res, next) => {
          quadStream = req.quadStream

          next()
        })

        await request(app).get('/?test=1')

        strictEqual(typeof quadStream, 'function')
      })

      it('should return the quads for the mapping via async call', async () => {
        let dataset = null
        const app = express()
        const fromQuad = rdf.quad(rdf.blankNode(), ex.from, rdf.literal('abc'))
        const toQuad = rdf.quad(rdf.blankNode(), ex.to, rdf.literal('xyz'))

        app.use(absolute(iriTemplateMappingBuilder({
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
  })

  describe('relative', () => {
    it('should be a function', () => {
      strictEqual(typeof relative, 'function')
    })

    it('should return a middleware function', () => {
      const instance = relative(iriTemplateMappingBuilder({ template: '{?test}' }))

      strictEqual(typeof instance, 'function')
      strictEqual(instance.length, 3)
    })

    it('should do nothing if the template doesn\'t match', async () => {
      let dataset = true
      let quadStream = true
      const app = express()

      app.use((req, res, next) => {
        req.hydra = {
          resource: {
            types: new TermSet([ex.Type])
          }
        }

        next()
      })

      app.use(relative(iriTemplateMappingBuilder({ type: ex.Type, template: '{?test}' })))

      app.use((req, res, next) => {
        dataset = req.dataset
        quadStream = req.quadStream

        next()
      })

      await request(app).get('/?other=1')

      strictEqual(typeof dataset, 'undefined')
      strictEqual(typeof quadStream, 'undefined')
    })

    it('should do nothing if the type doesn\'t match', async () => {
      let dataset = true
      let quadStream = true
      const app = express()

      app.use((req, res, next) => {
        req.hydra = {
          resource: {
            types: new TermSet([ex.TypeA])
          }
        }

        next()
      })

      app.use(relative(iriTemplateMappingBuilder({
        type: ex.TypeB,
        template: '{?test}',
        variables: {
          test: ex.test
        }
      })))

      app.use((req, res, next) => {
        dataset = req.dataset
        quadStream = req.quadStream

        next()
      })

      await request(app).get('/?test=1')

      strictEqual(typeof dataset, 'undefined')
      strictEqual(typeof quadStream, 'undefined')
    })

    it('should only handle the templates in the given graph', async () => {
      const datasets = {}
      const app = express()

      // create two templates, one in the default graph, the other in a named graph
      const { dataset } = iriTemplateMappingBuilder({
        type: ex.Type,
        template: '{?test1}',
        variables: {
          test1: ex.test
        }
      })

      const api = iriTemplateMappingBuilder({
        dataset,
        graph: ex.graph,
        type: ex.Type,
        template: '{?test2}',
        variables: {
          test2: ex.test
        }
      })

      app.use((req, res, next) => {
        req.hydra = {
          resource: {
            types: new TermSet([ex.Type])
          }
        }

        next()
      })

      app.use(relative(api))

      app.use((req, res, next) => {
        datasets[req.url] = req.dataset

        next()
      })

      await request(app).get('/?test1=1')
      await request(app).get('/?test2=2')

      strictEqual(typeof datasets['/?test1=1'], 'undefined')
      strictEqual(typeof datasets['/?test2=2'], 'function')
    })

    describe('.dataset', () => {
      it('should attach the method to the request', async () => {
        let dataset = true
        const app = express()

        app.use((req, res, next) => {
          req.hydra = {
            resource: {
              types: new TermSet([ex.Type])
            }
          }

          next()
        })

        app.use(relative(iriTemplateMappingBuilder({
          type: ex.Type,
          template: '{?test}',
          variables: {
            test: ex.test
          }
        })))

        app.use((req, res, next) => {
          dataset = req.dataset

          next()
        })

        await request(app).get('/?test=1')

        strictEqual(typeof dataset, 'function')
      })

      it('should return the quads for the mapping via async call', async () => {
        let dataset = null
        const app = express()
        const fromQuad = rdf.quad(rdf.blankNode(), ex.from, rdf.literal('abc'))
        const toQuad = rdf.quad(rdf.blankNode(), ex.to, rdf.literal('xyz'))

        app.use((req, res, next) => {
          req.hydra = {
            resource: {
              types: new TermSet([ex.Type])
            }
          }

          next()
        })

        app.use(relative(iriTemplateMappingBuilder({
          type: ex.Type,
          template: '{?from,to}',
          variables: {
            from: ex.from,
            to: ex.to
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
    })

    describe('.quadStream', () => {
      it('should attach the method to the request', async () => {
        let quadStream = true
        const app = express()

        app.use((req, res, next) => {
          req.hydra = {
            resource: {
              types: new TermSet([ex.Type])
            }
          }

          next()
        })

        app.use(relative(iriTemplateMappingBuilder({
          type: ex.Type,
          template: '{?test}',
          variables: {
            test: ex.test
          }
        })))

        app.use((req, res, next) => {
          quadStream = req.quadStream

          next()
        })

        await request(app).get('/?test=1')

        strictEqual(typeof quadStream, 'function')
      })

      it('should return the quads for the mapping via async call', async () => {
        let dataset = null
        const app = express()
        const fromQuad = rdf.quad(rdf.blankNode(), ex.from, rdf.literal('abc'))
        const toQuad = rdf.quad(rdf.blankNode(), ex.to, rdf.literal('xyz'))

        app.use((req, res, next) => {
          req.hydra = {
            resource: {
              types: new TermSet([ex.Type])
            }
          }

          next()
        })

        app.use(relative(iriTemplateMappingBuilder({
          type: ex.Type,
          template: '{?from,to}',
          variables: {
            from: ex.from,
            to: ex.to
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
  })
})
