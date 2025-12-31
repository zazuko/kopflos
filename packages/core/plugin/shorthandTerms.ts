import type { Stream } from '@rdfjs/types'
import type { Kopflos, KopflosPlugin } from '../lib/Kopflos.js'

export default class implements KopflosPlugin {
  apiTriples({ env }: Kopflos): Stream {
    return env.fromFile(new URL('../graphs/shorthands.ttl', import.meta.url))
  }
}
