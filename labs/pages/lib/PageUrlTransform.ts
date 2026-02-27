import type { TransformCallback } from 'node:stream'
import { Transform } from 'node:stream'
import type { KopflosEnvironment } from '@kopflos-cms/core'
import type { Quad } from '@rdfjs/types'
import type { Bindings } from '../queries/page-patterns.rq'

const groupRegex = /\(\?<(?<groupName>\w+)>.+\)/

export default class extends Transform {
  constructor(private pagePatterns: Bindings[], private env: KopflosEnvironment) {
    super({
      objectMode: true,
    })
  }

  _transform(chunk: Quad, encoding: BufferEncoding, callback: TransformCallback) {
    if (chunk.predicate.equals(this.env.ns.schema.mainEntityOfPage)) {
      const { pagePattern, resourcePattern } = this.pagePatterns.find(binding => binding.pagePattern.equals(chunk.object)) ?? <Bindings>{}
      const groups = chunk.subject.value.match(new RegExp(resourcePattern!.value))?.groups
      const pagePatternValue: string | undefined = pagePattern?.value
      const pageUrl = pagePatternValue?.replace(groupRegex, (_, groupName) => {
        return groups?.[groupName] ?? ''
      }).replace(/\$$/, '')

      if (pageUrl) {
        return callback(undefined, this.env.quad(chunk.subject, chunk.predicate, this.env.namedNode(pageUrl)))
      }
    }

    return callback(undefined, chunk)
  }
}
