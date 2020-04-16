const { fromStream, toStream } = require('rdf-dataset-ext')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }

class ResourceStore {
  constructor ({ factory = rdf, quadStore }) {
    this.factory = factory
    this.quadStore = quadStore
  }

  async read (resource) {
    const dataset = await fromStream(this.factory.dataset(), this.quadStore.match(null, null, null, resource))

    return this.factory.dataset([...dataset].map(quad => this.factory.quad(quad.subject, quad.predicate, quad.object)))
  }

  async write (resource, dataset) {
    const stream = toStream(this.factory.dataset([...dataset].map(quad => {
      return this.factory.quad(quad.subject, quad.predicate, quad.object, resource)
    })))

    const events = this.quadStore.import(stream)

    return new Promise((resolve, reject) => {
      events.on('end', () => resolve())
      events.on('error', err => reject(err))
    })
  }
}

module.exports = ResourceStore
