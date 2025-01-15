import * as url from 'node:url'
import type { KopflosConfig } from '@kopflos-cms/core'

const baseIri = process.env.API_BASE || 'http://localhost:1429'
const dbUri = process.env.DB_URI || 'http://localhost:7878'

export default <KopflosConfig> {
  baseIri,
  apiGraphs: [baseIri + '/api'],
  sparql: {
    default: {
      endpointUrl: dbUri + '/query?union-default-graph',
      updateUrl: dbUri + '/update',
      storeUrl: dbUri + '/store',
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
      apis: [baseIri + '/api'],
    },
  },
}
