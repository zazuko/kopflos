import url from 'node:url'
import type { KopflosConfig } from '@kopflos-cms/core'

export default <KopflosConfig> {
  baseIri: 'https://example.com/',
  sparql: {
    default: 'https://example.com/query',
  },
  watch: [
    url.fileURLToPath(new URL('fixtures', import.meta.url)),
  ],
}
