import type { KopflosConfig } from '@kopflos-cms/core'

export default <KopflosConfig> {
  deploy: ['resources', 'resources.dev'],
  baseIri: 'http://localhost:1429',
  apiGraphs: ['http://localhost:1429/api'],
  sparql: {
    default: {
      endpointUrl: 'http://localhost:7878/query?union-default-graph',
      updateUrl: 'http://localhost:7878/update',
    },
  },
}
