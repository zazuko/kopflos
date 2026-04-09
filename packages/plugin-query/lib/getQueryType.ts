import { Parser, Wildcard } from 'sparqljs'
import type { SelectQuery, Pattern, Quads, BgpPattern, Triple } from 'sparqljs'

const parser = new Parser()

export function getQueryType(query: string): 'SELECT' | 'CONSTRUCT' | 'ASK' | 'DESCRIBE' | 'UNKNOWN' {
  try {
    const parsed = parser.parse(query)
    if (parsed.type === 'query') {
      return parsed.queryType
    }
    return 'UNKNOWN'
  } catch {
    return 'UNKNOWN'
  }
}

function collectVariables(patterns: (Pattern | Quads)[] | undefined, variables: Set<string>) {
  if (!patterns) return

  for (const pattern of patterns) {
    if (pattern.type === 'bgp') {
      const bgp = pattern as BgpPattern
      for (const triple of bgp.triples) {
        addFromTriple(triple, variables)
      }
    } else if (pattern.type === 'graph') {
      if (pattern.name.termType === 'Variable') {
        variables.add(pattern.name.value)
      }
      if ('patterns' in pattern) {
        collectVariables(pattern.patterns, variables)
      } else if ('triples' in pattern) {
        for (const triple of pattern.triples) {
          addFromTriple(triple, variables)
        }
      }
    } else if (pattern.type === 'group' || pattern.type === 'union' || pattern.type === 'optional' || pattern.type === 'service' || pattern.type === 'minus') {
      collectVariables(pattern.patterns, variables)
    } else if (pattern.type === 'bind') {
      if (pattern.variable.termType === 'Variable') {
        variables.add(pattern.variable.value)
      }
    } else if (pattern.type === 'values') {
      for (const variable of pattern.values) {
        for (const [v, term] of Object.entries(variable)) {
          if (term) {
            variables.add(v.replace('?', ''))
          }
        }
      }
    }
  }
}

function addFromTriple(triple: Triple, variables: Set<string>) {
  if (triple.subject.termType === 'Variable') {
    variables.add(triple.subject.value)
  }
  if ('termType' in triple.predicate && triple.predicate.termType === 'Variable') {
    variables.add(triple.predicate.value)
  }
  if (triple.object.termType === 'Variable') {
    variables.add(triple.object.value)
  }
}

export function getVariables(query: string): string[] {
  try {
    const parsed = parser.parse(query)
    if (parsed.type === 'query' && parsed.queryType === 'SELECT') {
      const selectQuery = parsed as SelectQuery
      if (selectQuery.variables.some(v => v instanceof Wildcard || (typeof v === 'object' && 'termType' in v && (v as unknown as Wildcard).termType === 'Wildcard'))) {
        const variables = new Set<string>()
        collectVariables(selectQuery.where, variables)
        return [...variables]
      }

      return selectQuery.variables.map((variable) => {
        if ('termType' in variable && variable.termType === 'Variable') {
          return variable.value
        }
        if ('variable' in variable && variable.variable.termType === 'Variable') {
          return variable.variable.value
        }
        return ''
      }).filter(Boolean)
    }
    return []
  } catch {
    return []
  }
}
