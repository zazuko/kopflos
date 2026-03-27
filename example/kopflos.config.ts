import * as url from 'node:url'
import type { KopflosConfig } from '@kopflos-cms/core'
import { createOxigraphClients } from '@kopflos-cms/in-memory'
import DeployResources from '@kopflos-cms/plugin-deploy-resources'
import ExpressMiddleware from '@kopflos-cms/express/middleware'
import Vite from '@kopflos-cms/vite'
import Hydra from '@kopflos-cms/hydra'
import Shacl from '@kopflos-cms/shacl'
import PluginPages from '@kopflos-labs/pages'

const baseIri = process.env.API_BASE || 'http://localhost:1429'

export default <KopflosConfig>{
  baseIri,
  sparql: {
    default: createOxigraphClients(),
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
    new PluginPages({
      ssrOptions: {
        disallowConnectedCallback: [
          /^sl-/,
          /^ol-/,
        ],
      },
    }),
  ],
}
