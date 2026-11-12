import type { DataFactory, NamedNode, Term } from '@rdfjs/types'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type { Bindings } from '../queries/page-patterns.rq'
import type { Constraints } from './constraints.js'

export const pageUrlFunction = 'https://kopflos.described.at/pageUrl'

class PageUrlError extends Error {}

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

/** Compile destination routes once per page render, independently of output quads. */
export function createPageUrl(pages: Bindings[], env: Environment<NsBuildersFactory | DataFactory>, constraints?: Constraints) {
  const rules = pages.map(binding => ({
    pagePattern: binding.pagePattern,
    path: binding.path,
    regex: new RegExp(binding.resourcePattern.value),
    pageGroups: extractNamedGroupBodies(binding.pagePattern.value),
    resourceGroups: extractNamedGroupBodies(binding.resourcePattern.value),
  }))

  return (args: Term[]): NamedNode => {
    if (args.length !== 2 || args.some(arg => arg.termType !== 'NamedNode')) {
      throw new PageUrlError('kopflos:pageUrl requires two IRI arguments: resource and relationship')
    }
    const [resource, relationship] = args
    const urls = new Set<string>()
    const mainEntity = relationship.equals(env.ns.schema.mainEntity) || relationship.equals(env.ns.schema.mainEntityOfPage)
    for (const rule of rules) {
      const { pagePattern, path } = rule
      const matchesPath = path
        ? path.equals(relationship) || (mainEntity && (path.equals(env.ns.schema.mainEntity) || path.equals(env.ns.schema.mainEntityOfPage)))
        : relationship.equals(env.ns.schema.mainEntityOfPage)
      if (!matchesPath) continue
      const match = rule.regex.exec(resource.value)
      if (!match) continue
      const groups: Record<string, string> = { ...match.groups }

      if (constraints) {
        for (const [groupName, val] of Object.entries(groups)) {
          const constraint = constraints[groupName]
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

      const pageGroupBodies = rule.pageGroups
      const resGroupBodies = rule.resourceGroups

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

      if (pageUrl) urls.add(pageUrl)
    }
    if (urls.size !== 1) {
      throw new PageUrlError(urls.size ? 'Ambiguous page URL' : 'No matching page URL')
    }
    return env.namedNode([...urls][0])
  }
}

/**
 * Comunica 4 wraps thrown extension errors as fatal errors. Return a boolean on
 * resolution failure; SparqlProcessor wraps calls in IRI(), whose type error
 * has standard SPARQL expression semantics instead of aborting the query.
 */
export function createPageUrlExtension(...args: Parameters<typeof createPageUrl>) {
  const resolve = createPageUrl(...args)
  const env = args[1]
  return async (terms: Term[]) => {
    try {
      return resolve(terms)
    }
    catch (error) {
      if (!(error instanceof PageUrlError)) throw error
      return env.literal('false', env.ns.xsd.boolean)
    }
  }
}
