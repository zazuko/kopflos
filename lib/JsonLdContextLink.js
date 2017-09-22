const isEqual = require('lodash/isEqual')
const path = require('path')
const setLink = require('./setLink')
const url = require('url')

class JsonLdContextLink {
  constructor (options) {
    options = options || {}

    this.handle = this._handle.bind(this)

    this.iri = options.iri || '/'
    this.context = {}
  }

  _handle (req, res, next) {
    res.setJsonLdContext = this.setContextLink.bind(this, req, res)

    const pathname = url.parse(req.url).pathname

    if (pathname in this.context) {
      res.json(this.context[pathname])
    }

    next()
  }

  setContext (context, key) {
    let pathname = Object.keys(this.context).map((pathname) => {
      return isEqual(this.context[pathname], context) ? pathname : false
    }).filter(pathname => pathname).shift()

    if (!pathname) {
      pathname = path.resolve(this.iri, key)

      this.context[pathname] = context
    }

    return pathname
  }

  setContextLink (req, res, context, key) {
    const pathname = this.setContext(context, key)

    setLink.attach(res)

    res.setLink(this.absoluteLink(req, pathname), 'http://www.w3.org/ns/json-ld#context', {
      type: 'application/ld+json'
    })

    res.locals = res.locals || {}
    res.locals.jsonldContext = context
  }

  absoluteLink (req, pathname) {
    const base = url.parse(req.absoluteUrl())

    base.pathname = pathname
    base.search = null
    base.query = null

    return url.format(base)
  }

  static create (options) {
    return (new JsonLdContextLink(options)).handle
  }
}

module.exports = JsonLdContextLink
