import type { Constraints } from './constraints.js'

const groupRegex = /\[\[(?<optionalVar>\w+)]]|\[(?<requiredVar>\w+)]|\[\.\.\.(?<catchAllVar>\w+)]/g
const indexHtmlPattern = /(?<leadingSlash>\/)?index\.html\$$/

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function toPatterns(file: string, constraints?: Constraints, type: 'route' | 'resource' = 'route'): string[] {
  const replaceVar = (match: string, optionalVar?: string, requiredVar?: string, catchAllVar?: string) => {
    const varName = optionalVar || requiredVar || catchAllVar
    if (!varName) {
      return match
    }

    const constraint = constraints?.[varName]
    let inner: string | undefined

    if (constraint instanceof RegExp) {
      const source = constraint.source.replace(/^\^/, '').replace(/\$$/, '')
      inner = `(?<${varName}>${source})`
    }
    else if (Array.isArray(constraint)) {
      inner = `(?<${varName}>${constraint.map(escapeRegex).join('|')})`
    }
    else if (typeof constraint === 'object' && constraint !== null) {
      const list = type === 'route' ? Object.keys(constraint) : Object.values(constraint)
      inner = `(?<${varName}>${list.map(escapeRegex).join('|')})`
    }

    if (inner) {
      return optionalVar ? `${inner}?` : inner
    }

    if (optionalVar) {
      return `(?<${optionalVar}>[^/]+)?`
    }
    if (requiredVar) {
      return `(?<${requiredVar}>[^/]+)`
    }
    if (catchAllVar) {
      return `(?<${catchAllVar}>[/\\w]+)`
    }
    return match
  }

  const pattern = file.replaceAll(groupRegex, replaceVar)

  if (type === 'resource') {
    return [pattern]
  }

  const routePattern = pattern.replace(/\.\w+$/, '.html$')
  const matches = routePattern.match(indexHtmlPattern)

  if (matches) {
    const withoutIndex = routePattern === 'index.html$'
      ? routePattern.replace(indexHtmlPattern, '$')
      : routePattern.replace(indexHtmlPattern, '/?$')
    return [routePattern, withoutIndex]
  }

  return [routePattern]
}
