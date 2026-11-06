import type { TransformCallback } from 'node:stream'
import { Transform } from 'node:stream'
import type { DataFactory, Quad } from '@rdfjs/types'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type { Bindings } from '../queries/page-patterns.rq'
import type { Constraints } from './constraints.js'

function replaceNamedGroups(pattern: string, groups: Record<string, string>): string {
  let result = ''
  let i = 0

  while (i < pattern.length) {
    if (pattern.startsWith('(?<', i)) {
      const nameEnd = pattern.indexOf('>', i + 3)
      if (nameEnd !== -1) {
        const groupName = pattern.slice(i + 3, nameEnd)
        let depth = 1
        let inCharClass = false
        let j = nameEnd + 1

        while (j < pattern.length && depth > 0) {
          const char = pattern[j]
          if (char === '\\') {
            j += 2
            continue
          }
          if (char === '[' && !inCharClass) {
            inCharClass = true
          }
          else if (char === ']' && inCharClass) {
            inCharClass = false
          }
          else if (!inCharClass) {
            if (char === '(') {
              depth++
            }
            else if (char === ')') {
              depth--
            }
          }
          j++
        }

        if (depth === 0) {
          if (pattern[j] === '?') {
            j++
          }
          result += groups[groupName] ?? ''
          i = j
          continue
        }
      }
    }

    result += pattern[i]
    i++
  }

  return result
}

function extractNamedGroupBodies(pattern: string): Map<string, string> {
  const groups = new Map<string, string>()
  let i = 0

  while (i < pattern.length) {
    if (pattern.startsWith('(?<', i)) {
      const nameEnd = pattern.indexOf('>', i + 3)
      if (nameEnd !== -1) {
        const groupName = pattern.slice(i + 3, nameEnd)
        let depth = 1
        let inCharClass = false
        let j = nameEnd + 1
        const bodyStart = j

        while (j < pattern.length && depth > 0) {
          const char = pattern[j]
          if (char === '\\') {
            j += 2
            continue
          }
          if (char === '[' && !inCharClass) {
            inCharClass = true
          }
          else if (char === ']' && inCharClass) {
            inCharClass = false
          }
          else if (!inCharClass) {
            if (char === '(') {
              depth++
            }
            else if (char === ')') {
              depth--
            }
          }
          j++
        }

        if (depth === 0) {
          const body = pattern.slice(bodyStart, j - 1)
          groups.set(groupName, body)
          i = j
          continue
        }
      }
    }
    i++
  }

  return groups
}

function splitTopLevelAlternations(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let inCharClass = false
  let start = 0
  let i = 0

  while (i < body.length) {
    const char = body[i]
    if (char === '\\') {
      i += 2
      continue
    }
    if (char === '[' && !inCharClass) {
      inCharClass = true
    }
    else if (char === ']' && inCharClass) {
      inCharClass = false
    }
    else if (!inCharClass) {
      if (char === '(') {
        depth++
      }
      else if (char === ')') {
        depth--
      }
      else if (char === '|' && depth === 0) {
        parts.push(body.slice(start, i))
        start = i + 1
      }
    }
    i++
  }
  parts.push(body.slice(start))
  return parts
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function unescapeRegex(str: string): string {
  return str.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
}

function isLiteralPattern(pattern: string): boolean {
  return escapeRegex(unescapeRegex(pattern)) === pattern
}

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

        const pageGroupBodies = extractNamedGroupBodies(pagePattern.value)
        const resGroupBodies = extractNamedGroupBodies(resourcePattern.value)

        for (const [groupName, val] of Object.entries(groups)) {
          const pageBody = pageGroupBodies.get(groupName)
          const resBody = resGroupBodies.get(groupName)
          if (pageBody && resBody) {
            const pageAlts = splitTopLevelAlternations(pageBody)
            const resAlts = splitTopLevelAlternations(resBody)
            if (pageAlts.length === resAlts.length) {
              for (let i = 0; i < resAlts.length; i++) {
                if (resAlts[i] !== pageAlts[i] && isLiteralPattern(resAlts[i]) && isLiteralPattern(pageAlts[i])) {
                  const resVal = unescapeRegex(resAlts[i])
                  if (val === resVal) {
                    groups[groupName] = unescapeRegex(pageAlts[i])
                    break
                  }
                }
              }
            }
          }
        }

        const pagePatternValue: string = pagePattern.value
        const pageUrl = replaceNamedGroups(pagePatternValue, groups)
          .replace(/\$$/, '')
          .replace(/^\^/, '')

        if (pageUrl) {
          return callback(undefined, this.env.quad(chunk.subject, chunk.predicate, this.env.namedNode(pageUrl)))
        }
      }
    }

    return callback(undefined, chunk)
  }
}
