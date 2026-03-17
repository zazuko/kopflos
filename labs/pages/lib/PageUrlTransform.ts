import type { TransformCallback } from 'node:stream'
import { Transform } from 'node:stream'
import type { DataFactory, Quad } from '@rdfjs/types'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type { Bindings } from '../queries/page-patterns.rq'

const groupRegex = /\(\?<(?<groupName>\w+)>.+?\)/

export default class extends Transform {
  constructor(private pagePatterns: Bindings[], private env: Environment<NsBuildersFactory | DataFactory>) {
    super({
      objectMode: true,
    })
  }

  _transform(chunk: Quad, encoding: BufferEncoding, callback: TransformCallback) {
    if (chunk.predicate.equals(this.env.ns.schema.mainEntityOfPage)) {
      const binding = this.pagePatterns.find(binding => binding.pagePattern.equals(chunk.object))
      if (binding) {
        const { pagePattern, resourcePattern } = binding
        const groups = chunk.subject.value.match(new RegExp(resourcePattern.value))?.groups
        const pagePatternValue: string = pagePattern.value
        const pageUrl = pagePatternValue.replace(new RegExp(groupRegex, 'g'), (_, groupName) => {
          return groups?.[groupName] ?? ''
        }).replace(/\$$/, '')

        if (pageUrl) {
          return callback(undefined, this.env.quad(chunk.subject, chunk.predicate, this.env.namedNode(pageUrl)))
        }
      }
    }

    return callback(undefined, chunk)
  }
}
