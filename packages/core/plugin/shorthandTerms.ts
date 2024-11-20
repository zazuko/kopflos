import type { Stream } from '@rdfjs/types'
import type { KopflosPlugin } from '../lib/Kopflos.js'

export default function (): KopflosPlugin {
  return {
    apiTriples(kopflos): Stream {
      const { env } = kopflos
      return env.fromFile(new URL('../graphs/shorthands.ttl', import.meta.url))
    },
  }
}
