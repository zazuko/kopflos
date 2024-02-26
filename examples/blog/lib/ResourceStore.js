import rdf from '@zazuko/env-node'

export default class ResourceStore {
  constructor({ factory = rdf, quadStore }) {
    this.factory = factory
    this.quadStore = quadStore
  }

  async read(resource) {
    const dataset = await this.factory.dataset().import(this.quadStore.match(null, null, null, resource))

    return this.factory.dataset([...dataset].map(quad => this.factory.quad(quad.subject, quad.predicate, quad.object)))
  }

  async write(resource, dataset) {
    const stream = this.factory.dataset([...dataset].map(quad => {
      return this.factory.quad(quad.subject, quad.predicate, quad.object, resource)
    })).toStream()

    const events = this.quadStore.import(stream)

    return new Promise((resolve, reject) => {
      events.on('end', () => resolve())
      events.on('error', err => reject(err))
    })
  }
}
