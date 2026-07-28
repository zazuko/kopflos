const groupRegex = /\[\[(?<optionalVar>\w+)]]|\[(?<requiredVar>\w+)]|\[\.\.\.(?<catchAllVar>\w+)]/g
const indexHtmlPattern = /(?<leadingSlash>\/)?index\.html\$$/

export function toPatterns(file: string): string[] {
  const pattern = file.replaceAll(groupRegex, (match, optionalVar, requiredVar, catchAllVar) => {
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
  })
    .replace(/\.\w+$/, '.html$')

  const matches = pattern.match(indexHtmlPattern)

  if (matches) {
      return [pattern, pattern.replace(indexHtmlPattern, '$')]
  }

  return [pattern]
}
