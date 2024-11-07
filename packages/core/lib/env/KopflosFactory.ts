import type { KopflosConfig } from '../Kopflos.js'

export interface KopflosFactory {
  readonly kopflos: {
    readonly config: KopflosConfig
    readonly variables: Record<string, unknown>
  }
}

export default (config: KopflosConfig) => {
  const variables = config.variables || {}

  return class implements KopflosFactory {
    get kopflos() {
      return {
        config: Object.freeze(config),
        variables,
      }
    }

    static exports = ['kopflos']
  }
}
