import type { Stream } from '@rdfjs/types'
import type { Kopflos, KopflosPlugin, KopflosPluginConstructor } from '../lib/Kopflos.js'

export default function (): KopflosPluginConstructor {
  return class implements KopflosPlugin {
    constructor(private readonly kopflos: Kopflos) {
    }

    apiTriples(): Stream {
      const { env } = this.kopflos
      return env.fromFile(new URL('../graphs/shorthands.ttl', import.meta.url))
    }
  }
}
