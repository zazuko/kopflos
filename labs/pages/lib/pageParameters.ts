export function fillTemplate(pattern: string, subjectVariables: Record<string, string>): string | null {
  const variables: string[] = []
  const regexStr = pattern.replace(/\[(\w+)]/g, (_, name) => {
    variables.push(name)
    return '(?<' + name + '>[^/]+)'
  })
  const regex = new RegExp(`^${regexStr}$`)

  // We need to find if any of the subjectVariables match the pattern's variables
  // Actually, if we are in [name].html, subjectVariables['name'] is available.
  // If the pattern is 'https://.../[name]', we can reconstruct the IRI.
  let iri = pattern
  let allVarsFound = true
  for (const v of variables) {
    if (subjectVariables[v]) {
      iri = iri.replace(`[${v}]`, subjectVariables[v])
    } else {
      allVarsFound = false
      break
    }
  }

  return allVarsFound ? iri : null
}
