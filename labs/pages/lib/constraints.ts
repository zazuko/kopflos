export type Constraint
  = | RegExp
    | Record<string, string>
    | string[]
    | readonly string[]
export type Constraints = Record<string, Constraint>

export function validateConstraints(constraints: Constraints, subjectVariables: Record<string, string> = {}): boolean {
  for (const [varName, constraint] of Object.entries(constraints)) {
    const val = subjectVariables[varName]
    if (val !== undefined) {
      if (constraint instanceof RegExp) {
        if (!constraint.test(val)) return false
      }
      else if (Array.isArray(constraint)) {
        if (!constraint.includes(val)) return false
      }
      else if (typeof constraint === 'object' && constraint !== null) {
        if (!Object.prototype.hasOwnProperty.call(constraint, val) && !(val in constraint)) return false
      }
    }
  }

  return true
}
