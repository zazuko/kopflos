/* global describe, it */

const assert = require('assert')
const express = require('express')
const jsonldContextLink = require('jsonld-context-link')
const ns = require('../lib/namespaces')
const path = require('path')
const rdf = require('rdf-ext')
const request = require('supertest')
const BodyParser = require('../lib/BodyParser')

function buildOptions (options) {
  options = options || {}

  options.iri = options.iri || rdf.namedNode('http://example.org/subject')

  if (!options.api) {
    const returnFrame = rdf.namedNode('file://' + path.join(__dirname, 'support/context.json'))

    options.api = rdf.dataset([
      rdf.quad(options.iri, ns.hydraBox.returnFrame, returnFrame)
    ])
  }

  return options
}

describe('BodyParser', () => {
  it('should be a constructor', () => {
    assert.equal(typeof BodyParser, 'function')
  })

  it('should assign the contextHeader options', () => {
    const options = buildOptions()

    options.contextHeader = '/context/'

    const bodyParser = new BodyParser(options)

    assert.equal(bodyParser.contextHeader, '/context/')
  })

  describe('.init', () => {
    it('should be a method', () => {
      const bodyParser = new BodyParser(buildOptions())

      assert.equal(typeof bodyParser.init, 'function')
    })

    it('should return itself', () => {
      const bodyParser = new BodyParser(buildOptions())

      return bodyParser.init().then((result) => {
        assert.equal(result, bodyParser)
      })
    })

    it('should assign .customFormats', () => {
      return (new BodyParser(buildOptions())).init().then((bodyParser) => {
        assert(bodyParser.customFormats)
        assert.equal(typeof bodyParser.customFormats.serializers, 'object')
      })
    })

    it('should assign .returnFrame', () => {
      return (new BodyParser(buildOptions())).init().then((bodyParser) => {
        assert(bodyParser.returnFrame.value.indexOf('support/context.json') !== -1)
      })
    })

    it('should fetch the frame content', () => {
      return (new BodyParser(buildOptions())).init().then((bodyParser) => {
        assert.equal(bodyParser.returnFrameContent['@context']['@vocab'], 'http://schema.org/')
      })
    })

    it('should assign a JSON serializer', () => {
      return (new BodyParser(buildOptions())).init().then((bodyParser) => {
        assert(bodyParser.customFormats.serializers['application/json'])
      })
    })
  })

  describe('.handle', () => {
    it('should be a method', () => {
      const bodyParser = new BodyParser(buildOptions())

      assert.equal(typeof bodyParser.handle, 'function')
    })

    it('should send JSON response with context header', () => {
      const subject = rdf.namedNode('http://example.org/subject')

      const data = rdf.dataset([
        rdf.quad(
          subject,
          rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          rdf.namedNode('http://schema.org/Thing')
        )
      ])

      return (new BodyParser(buildOptions({contextHeader: true}))).init().then((bodyParser) => {
        const app = express()

        app.use(jsonldContextLink({
          basePath: '/context/'
        }))

        app.use(bodyParser.handle)

        app.get('/', (req, res) => {
          res.graph(data)
        })

        return request(app)
          .get('/')
          .set('accept', 'application/json')
          .then((res) => {
            assert(res.headers.link.indexOf('context/context.json>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"') !== -1)
            assert.deepEqual(res.body, {
              '@id': 'http://example.org/subject',
              '@type': 'Thing'
            })
          })
      })
    })

    it('should send JSON-LD response with context in body', () => {
      const subject = rdf.namedNode('http://example.org/subject')

      const data = rdf.dataset([
        rdf.quad(
          subject,
          rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          rdf.namedNode('http://schema.org/Thing')
        )
      ])

      return (new BodyParser(buildOptions({contextHeader: true}))).init().then((bodyParser) => {
        const app = express()

        app.use(jsonldContextLink({
          basePath: '/context/'
        }))

        app.use(bodyParser.handle)

        app.get('/', (req, res) => {
          res.graph(data)
        })

        return request(app)
          .get('/')
          .set('accept', 'application/ld+json')
          .then((res) => {
            assert(!res.headers.link)
            assert.deepEqual(res.body, [{
              '@graph': {
                '@id': 'http://example.org/subject',
                '@type': 'http://schema.org/Thing'
              },
              '@id': '@default'
            }])
          })
      })
    })
  })
})
