import type { KopflosConfig } from '../Kopflos.js'

export interface KopflosFactory {
  readonly kopflos: {
    readonly config: KopflosConfig
  }
}

export default (config: KopflosConfig) => class implements KopflosFactory {
  get kopflos() {
    return {
      config: Object.freeze(config),
    }
  }

  static exports = ['kopflos']
}
