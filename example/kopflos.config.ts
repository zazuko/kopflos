import * as url from 'node:url'
import type { KopflosConfig } from '@kopflos-cms/core'

export default <KopflosConfig> {
  baseIri: 'http://localhost:1429',
  apiGraphs: ['http://localhost:1429/api'],
  sparql: {
    default: {
      endpointUrl: 'http://localhost:7878/query?union-default-graph',
      updateUrl: 'http://localhost:7878/update',
      storeUrl: 'http://localhost:7878/store',
    },
  },
  watch: ['lib'],
  plugins: {
    '@kopflos-cms/plugin-deploy-resources': {
      paths: ['resources', 'resources.dev'],
    },
    '@kopflos-cms/express/middleware': {
      before: [
        'cors',
        ['compression', { level: 9 }],
        url.fileURLToPath(new URL('lib/static.js', import.meta.url)),
      ],
    },
    '@kopflos-cms/vite': {
      root: 'ui',
      entrypoints: ['ui/*.html'],
    },
    '@kopflos-cms/hydra': {
      apis: ['http://localhost:1429/api'],
    },
  },
}
