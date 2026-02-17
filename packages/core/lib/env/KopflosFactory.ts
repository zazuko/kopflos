import type { KopflosConfig } from '../Kopflos.js'

export interface KopflosFactory {
  readonly kopflos: {
    readonly config: KopflosConfig
    readonly variables: Record<string, unknown>
  }
}

export default (config: KopflosConfig, basePath: string) => {
  const variables = config.variables || {}

  return class implements KopflosFactory {
    get kopflos() {
      return {
        basePath,
        buildDir: config.buildDir || 'dist',
        config: Object.freeze(config),
        variables,
      }
    }

    static exports = ['kopflos']
  }
}
