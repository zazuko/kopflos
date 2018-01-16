const clone = require('lodash/clone')
const fetch = require('./fetch')
const formats = require('rdf-formats-common')()
const path = require('path')
const ns = require('./namespaces')
const rdf = require('rdf-ext')
const rdfBodyParser = require('rdf-body-parser')
const ApiObject = require('./ApiObject')
const CsvSerializer = require('rdf-serializer-csvw')
const JsonLdSerializer = require('rdf-serializer-jsonld-ext')

class BodyParser extends ApiObject {
  constructor (options) {
    super(options.api, options.iri)

    this.contextHeader = options.contextHeader

    this.handle = this._handle.bind(this)
  }

  init () {
    this.customFormats = {
      parsers: clone(formats.parsers),
      serializers: clone(formats.serializers)
    }

    return Promise.all([
      this.initCsv(),
      this.initJsonld()
    ]).then(() => this)
  }

  initJsonld () {
    this.returnFrame = this.valueTerm(ns.hydraBox.returnFrame)

    if (!this.returnFrame) {
      return
    }

    return fetch(this.returnFrame.value).then(res => res.json()).then((frame) => {
      this.returnFrameContent = frame
      this.returnFrameKey = path.basename(this.returnFrame.value)

      const jsonSerializer = new JsonLdSerializer({
        context: this.returnFrameContent,
        frame: true,
        outputFormat: 'string',
        skipContext: this.contextHeader,
        skipGraphProperty: true
      })

      this.customFormats.serializers['application/json'] = jsonSerializer
    })
  }

  initCsv () {
    this.returnCsvMetadata = this.valueTerm(ns.hydraBox.returnCsvMetadata)

    return Promise.resolve().then(() => {
      if (this.returnCsvMetadata) {
        return fetch(this.returnCsvMetadata.value).then(res => res.json()).then((metadata) => {
          this.returnCsvMetadataContent = metadata
        })
      }
    }).then(() => {
      this.customFormats.serializers['text/csv'] = new CsvSerializer({
        metadata: this.returnCsvMetadataContent
      })
    })
  }

  _handle (req, res, next) {
    res.on('pipe', () => {
      if (this.contextHeader && (res.getHeader('content-type') || '').split(';').shift() === 'application/json') {
        res.setJsonldContext(this.returnFrame, this.returnFrameKey)
      }
    })

    rdfBodyParser.attach(req, res, {formats: this.customFormats}).then(() => {
      req.graph = req.graph || rdf.dataset()
    }).then(next).catch(next)
  }
}

module.exports = BodyParser
