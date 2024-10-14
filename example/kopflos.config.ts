import * as url from 'node:url'
import type { KopflosConfig } from '@kopflos-cms/core'

export default <KopflosConfig> {
  baseIri: 'http://localhost:1429',
  apiGraphs: ['http://localhost:1429/api'],
  sparql: {
    default: {
      endpointUrl: 'http://localhost:7878/query?union-default-graph',
      updateUrl: 'http://localhost:7878/update',
    },
  },
  variables: {
    uiRoot: 'ui',
  },
  plugins: {
    '@kopflos-cms/plugin-deploy-resources': {
      paths: ['resources', 'resources.dev'],
    },
    '@kopflos-cms/plugin-express': {
      before: [
        'cors',
        ['compression', { level: 9 }],
        url.fileURLToPath(new URL('.', import.meta.url) + 'lib/static.js'),
      ],
    },
    '@kopflos-cms/vite': {
      root: 'ui',
      entrypoints: ['ui/*.html'],
    },
  },
}
