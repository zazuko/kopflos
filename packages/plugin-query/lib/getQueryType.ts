import { Parser } from 'sparqljs'

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
