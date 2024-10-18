import type { KopflosPlugin } from '../lib/Kopflos.js'

export default function (): KopflosPlugin {
  return {
    async onStart(kopflos): Promise<void> {
      const { env } = kopflos
      const shorthands = env.fromFile(new URL('../graphs/shorthands.ttl', import.meta.url))

      await kopflos.dataset.import(shorthands)
    },
  }
}
