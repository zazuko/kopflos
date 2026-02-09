import * as url from 'node:url'
import type { KopflosConfig } from '@kopflos-cms/core'
import DeployResources from '@kopflos-cms/plugin-deploy-resources'
import ExpressMiddleware from '@kopflos-cms/express/middleware' // eslint-disable-line import/no-unresolved
import Vite from '@kopflos-cms/vite'
import Hydra from '@kopflos-cms/hydra'
import Shacl from '@kopflos-cms/shacl'

const baseIri = process.env.API_BASE || 'http://localhost:1429'
const dbUri = process.env.DB_URI || 'http://localhost:7878'

export default <KopflosConfig>{
  baseIri,
  apiGraphs: [baseIri + '/api'],
  sparql: {
    default: {
      endpointUrl: dbUri + '/query?union-default-graph',
      updateUrl: dbUri + '/update',
      storeUrl: dbUri + '/store',
    },
    lindas: 'https://lindas.admin.ch/query',
  },
  watch: ['lib'],
  plugins: [
    new DeployResources({
      paths: ['resources', 'resources.dev'],
    }),
    new ExpressMiddleware({
      before: [
        'cors',
        ['compression', { level: 9 }],
        url.fileURLToPath(new URL('lib/static.js', import.meta.url)),
      ],
    }),
    new Vite({
      root: 'ui',
      entrypoints: ['ui/*.html'],
      config: {
        server: {
          allowedHosts: ['read-the-plaque.lndo.site'],
        },
      },
    }),
    new Hydra({
      apis: [baseIri + '/api'],
    }),
    new Shacl(),
  ],
}
