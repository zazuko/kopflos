export function toPattern(file: string): string {
  const pattern = /\[\[(?<optionalVar>\w+)]]|\[(?<requiredVar>\w+)]|\[\.\.\.(?<catchAllVar>\w+)]/g

  return file.replaceAll(pattern, (match, optionalVar, requiredVar, catchAllVar) => {
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
  }).replace(/\.\w+$/, '.html$')
}
