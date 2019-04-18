/* global describe, it, beforeEach, afterEach */

const assert = require('assert')
const fs = require('fs')
const ns = require('../lib/namespaces')
const path = require('path')
const rdf = require('rdf-ext')
const SparqlView = require('../lib/SparqlView')
const sinon = require('sinon')
const SparqlHttp = require('sparql-http-client')

describe('SparqlView', () => {
  it('should be a constructor', () => {
    assert.equal(typeof SparqlView, 'function')
  })

  it('should assign the options', () => {
    const api = rdf.dataset()
    const iri = rdf.namedNode('http://example.org/')
    const queryUrl = 'http://example.org/query'
    const updateUrl = 'http://example.org/update'

    const view = new SparqlView({api, iri, debug: true, queryUrl, updateUrl})

    assert.equal(view.api, api)
    assert.equal(view.iri, iri)
    assert.equal(view.debug, true)
    assert.equal(view.queryUrl, queryUrl)
    assert.equal(view.updateUrl, updateUrl)
  })

  it('should assign code, source and variables from the API', () => {
    const iri = rdf.namedNode('http://example.org/operation')

    const code = rdf.blankNode()
    const source = rdf.blankNode()
    const variables = rdf.blankNode()

    const api = rdf.dataset([
      rdf.quad(iri, ns.hydraBox.code, code),
      rdf.quad(code, ns.hydraBox.source, source),
      rdf.quad(iri, ns.hydraBox.variables, variables)
    ])

    const view = new SparqlView({api, iri})

    assert.equal(view.code, code)
    assert.equal(view.source, source)
    assert.equal(view.variables, variables)
  })

  describe('init', () => {
    it('should be a method', () => {
      const api = rdf.dataset()
      const iri = rdf.namedNode('http://example.org/')

      const view = new SparqlView({api, iri})

      assert.equal(typeof view.init, 'function')
    })

    it('should fetch the SPARQL template from the given URL', () => {
      const filePath = path.join(__dirname, 'support/sparql.es6')

      const iri = rdf.namedNode('http://example.org/operation')

      const code = rdf.blankNode()
      const source = rdf.namedNode('file://' + filePath)

      const api = rdf.dataset([
        rdf.quad(iri, ns.hydraBox.code, code),
        rdf.quad(code, ns.hydraBox.source, source)
      ])

      const view = new SparqlView({api, iri})

      return view.init().then(() => {
        assert.equal(view.sparqlQuery, fs.readFileSync(filePath).toString())
      })
    })

    it('should create a SPARQL client pointing to the endpoint URL', () => {
      const filePath = path.join(__dirname, 'support/sparql.es6')

      const iri = rdf.namedNode('http://example.org/operation')

      const code = rdf.blankNode()
      const source = rdf.namedNode('file://' + filePath)

      const api = rdf.dataset([
        rdf.quad(iri, ns.hydraBox.code, code),
        rdf.quad(code, ns.hydraBox.source, source)
      ])

      const queryUrl = 'http://example.org/query'

      const view = new SparqlView({api, iri, queryUrl})

      return view.init().then(() => {
        assert.equal(typeof view.client, 'object')
        assert.equal(view.client.endpointUrl, queryUrl)
      })
    })
  })

  describe('handle', () => {
    let buildVariables

    beforeEach(() => {
      buildVariables = sinon.stub(SparqlView, 'evalTemplateString')
    })

    it('pushes environment variables to `evalTemplateString`', () => {
      // given
      const api = rdf.dataset()
      const iri = rdf.namedNode('http://example.org/')
      const view = new SparqlView({ api, iri })
      const next = sinon.stub()
      sinon.stub(view, 'buildVariables')
      const res = sinon.stub()
      view.client = sinon.createStubInstance(SparqlHttp, {
        constructQuery: sinon.stub().resolves({
          quadStream: sinon.stub()
        })
      })
      process.env.MY_VAR = 'localhost'

      // when
      view._handle(null, res, next)

      // then
      assert(buildVariables.calledWith(
        sinon.match.any,
        sinon.match.any,
        sinon.match({
          env: {
            MY_VAR: 'localhost'
          }
        })
      ))
    })

    afterEach(() => {
      SparqlView.evalTemplateString.restore()
    })
  })

  describe('buildVariables', () => {
    it('should be a method', () => {
      const api = rdf.dataset()
      const iri = rdf.namedNode('http://example.org/')

      const view = new SparqlView({api, iri})

      assert.equal(typeof view.buildVariables, 'function')
    })

    it('should build an object with variable key value pairs', () => {
      const iri = rdf.namedNode('http://example.org/')

      const variables = rdf.blankNode()
      const variableA = rdf.blankNode()
      const variableAIri = rdf.namedNode('http://example.org/var/a')
      const variableB = rdf.blankNode()
      const variableBIri = rdf.namedNode('http://example.org/var/b')

      const api = rdf.dataset([
        rdf.quad(iri, ns.hydraBox.variables, variables),
        rdf.quad(variables, ns.hydra.mapping, variableA),
        rdf.quad(variableA, ns.hydra.variable, rdf.literal('a')),
        rdf.quad(variableA, ns.hydra.property, variableAIri),
        rdf.quad(variables, ns.hydra.mapping, variableB),
        rdf.quad(variableB, ns.hydra.variable, rdf.literal('b')),
        rdf.quad(variableB, ns.hydra.property, variableBIri)
      ])

      const root = rdf.blankNode()
      const valueA = rdf.literal('valueA')
      const valueB = rdf.literal('valueB')

      const graph = rdf.dataset([
        rdf.quad(root, variableAIri, valueA),
        rdf.quad(root, variableBIri, valueB)
      ])

      const view = new SparqlView({api, iri})

      const locals = view.buildVariables({graph})

      assert.equal(locals.a.toCanonical(), valueA.toCanonical())
      assert.equal(locals.b.toCanonical(), valueB.toCanonical())
    })

    it('should ignore variables not defined in the mapping', () => {
      const iri = rdf.namedNode('http://example.org/')

      const variables = rdf.blankNode()
      const variableA = rdf.blankNode()
      const variableAIri = rdf.namedNode('http://example.org/var/a')
      const variableBIri = rdf.namedNode('http://example.org/var/b')

      const api = rdf.dataset([
        rdf.quad(iri, ns.hydraBox.variables, variables),
        rdf.quad(variables, ns.hydra.mapping, variableA),
        rdf.quad(variableA, ns.hydra.variable, rdf.literal('a')),
        rdf.quad(variableA, ns.hydra.property, variableAIri)
      ])

      const root = rdf.blankNode()
      const valueA = rdf.literal('valueA')
      const valueB = rdf.literal('valueB')

      const graph = rdf.dataset([
        rdf.quad(root, variableAIri, valueA),
        rdf.quad(root, variableBIri, valueB)
      ])

      const view = new SparqlView({api, iri})

      const locals = view.buildVariables({graph})

      assert.equal(locals.a.toCanonical(), valueA.toCanonical())
      assert.equal(locals.b, undefined)
    })

    it('should build array values for variables with multiple values', () => {
      const iri = rdf.namedNode('http://example.org/')

      const variables = rdf.blankNode()
      const variableA = rdf.blankNode()
      const variableAIri = rdf.namedNode('http://example.org/var/a')

      const api = rdf.dataset([
        rdf.quad(iri, ns.hydraBox.variables, variables),
        rdf.quad(variables, ns.hydra.mapping, variableA),
        rdf.quad(variableA, ns.hydra.variable, rdf.literal('a')),
        rdf.quad(variableA, ns.hydra.property, variableAIri)
      ])

      const root = rdf.blankNode()
      const valueA0 = rdf.literal('valueA0')
      const valueA1 = rdf.literal('valueA1')

      const graph = rdf.dataset([
        rdf.quad(root, variableAIri, valueA0),
        rdf.quad(root, variableAIri, valueA1)
      ])

      const view = new SparqlView({api, iri})

      const locals = view.buildVariables({graph})

      assert(Array.isArray(locals.a))
      assert.equal(locals.a[0].toCanonical(), valueA0.toCanonical())
      assert.equal(locals.a[1].toCanonical(), valueA1.toCanonical())
    })
  })

  describe('evalTemplateString', () => {
    it('should be a static method', () => {
      assert.equal(typeof SparqlView.evalTemplateString, 'function')
    })

    it('should return the evaluated template string', () => {
      const result = SparqlView.evalTemplateString('${1 + 1}', {}) // eslint-disable-line no-template-curly-in-string

      assert.equal(result, 2)
    })

    it('should forward the variables defined as object key value pairs', () => {
      const params = {
        a: 2,
        b: 3
      }

      const result = SparqlView.evalTemplateString('${a + b}', params) // eslint-disable-line no-template-curly-in-string

      assert.equal(result, params.a + params.b)
    })

    it('should use the given context to evaluate the template', () => {
      const context = {
        a: 2,
        b: 3
      }

      const result = SparqlView.evalTemplateString('${this.a + this.b}', {}, context) // eslint-disable-line no-template-curly-in-string

      assert.equal(result, context.a + context.b)
    })
  })
})
