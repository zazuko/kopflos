# @kopflos-cms/plugin-query

This Kopflos plugin provides a SPARQL query interface and proxy.

## Features

1.  **YASGUI Interface**: Serves a static HTML page with [YASGUI](https://triply.cc/docs/yasgui) loaded from CDN at `/-/query`.
2.  **SPARQL Proxy**: Routes at `/-/query/{endpoint}` proxy SPARQL queries to the endpoints configured in your Kopflos configuration.

## Installation

```bash
npm install @kopflos-cms/plugin-query
```

## Usage

Add the plugin to your `kopflos.config.ts`:

```typescript
import { KopflosConfig } from '@kopflos-cms/core'
import QueryPlugin from '@kopflos-cms/plugin-query'

export default <KopflosConfig>{
  // ... other config
  sparql: {
    default: 'https://your-sparql-endpoint.com/query',
    // ... other endpoints
  },
  plugins: [
    // ... other plugins
    new QueryPlugin(),
  ],
}
```

Once registered, you can access the query interface at `/-/query`.
The plugin will automatically register proxy routes for all SPARQL endpoints defined in your configuration.
