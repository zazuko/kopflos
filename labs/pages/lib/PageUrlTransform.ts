import type { TransformCallback } from 'node:stream'
import { Transform } from 'node:stream'
import type { DataFactory, Quad } from '@rdfjs/types'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type { Bindings } from '../queries/page-patterns.rq'
import type { Constraints } from './constraints.js'

const groupRegex = /\(\?<(?<groupName>\w+)>.+?\)/

export default class extends Transform {
  constructor(
    private pagePatterns: Bindings[],
    private env: Environment<NsBuildersFactory | DataFactory>,
    private constraints?: Constraints,
  ) {
    super({
      objectMode: true,
    })
  }

  _transform(chunk: Quad, encoding: BufferEncoding, callback: TransformCallback) {
    const isMatchingBinding = (binding: Bindings) => {
      if (!binding.pagePattern.equals(chunk.object)) {
        return false
      }
      if (!binding.path) {
        return chunk.predicate.equals(this.env.ns.schema.mainEntityOfPage)
      }
      if (binding.path.equals(this.env.ns.schema.mainEntity)) {
        return chunk.predicate.equals(this.env.ns.schema.mainEntityOfPage) || chunk.predicate.equals(this.env.ns.schema.mainEntity)
      }
      return binding.path.equals(chunk.predicate)
    }

    const binding = this.pagePatterns.find(binding =>
      isMatchingBinding(binding) && new RegExp(binding.resourcePattern.value).test(chunk.subject.value),
    )

    if (binding) {
      const { pagePattern, resourcePattern } = binding
      const match = chunk.subject.value.match(new RegExp(resourcePattern.value))
      if (match) {
        const groups: Record<string, string> = { ...match.groups }

        if (this.constraints) {
          for (const [groupName, val] of Object.entries(groups)) {
            const constraint = this.constraints[groupName]
            if (constraint) {
              if (typeof constraint === 'object' && !Array.isArray(constraint) && !(constraint instanceof RegExp) && constraint !== null) {
                for (const [k, v] of Object.entries(constraint)) {
                  if (v === val) {
                    groups[groupName] = k
                    break
                  }
                }
              }
            }
          }
        }

        const pagePatternValue: string = pagePattern.value
        const pageUrl = pagePatternValue.replace(new RegExp(groupRegex, 'g'), (_, groupName) => {
          return groups?.[groupName] ?? ''
        }).replace(/\$$/, '').replace(/^\^/, '')

        if (pageUrl) {
          return callback(undefined, this.env.quad(chunk.subject, chunk.predicate, this.env.namedNode(pageUrl)))
        }
      }
    }

    return callback(undefined, chunk)
  }
}
