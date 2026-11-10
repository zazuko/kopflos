# Remote SPARQL endpoints

Kopflos accepts a query endpoint URL, `sparql-http-client` options, or a preconfigured `{ stream, parsed }` client pair for each configuration `sparql` entry. `default` is required; other names expose additional clients without changing core's default routing or loaders.

```ts
import type { KopflosConfig } from '@kopflos-cms/core'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export default {
  baseIri: 'https://example.org',
  sparql: {
    default: {
      endpointUrl: required('SPARQL_QUERY_URL'),
      updateUrl: required('SPARQL_UPDATE_URL'),
      storeUrl: required('SPARQL_STORE_URL'),
      user: required('SPARQL_USER'),
      password: required('SPARQL_PASSWORD'),
    },
    catalog: 'https://data.example.org/sparql',
  },
} satisfies KopflosConfig
```

This example configures a writable store with Basic authentication. Omit credentials for an unauthenticated store and omit write URLs if the application only reads an already-populated store.

| Option             | Operation                                                |
|--------------------|----------------------------------------------------------|
| `endpointUrl`      | SPARQL SELECT, ASK, CONSTRUCT, DESCRIBE                  |
| `updateUrl`        | SPARQL Update through `client.query.update(...)`         |
| `storeUrl`         | Graph Store Protocol operations through `client.store`   |
| `user`, `password` | HTTP Basic authentication                                |
| `headers`          | Additional HTTP headers, including bearer authentication |

The URLs are independent and store-specific. A string entry supplies only `endpointUrl`; it does not configure graph writes or derive the other URLs. Resource deployment uses Graph Store operations and needs the appropriate writable URL even when SPARQL queries work. Keep `baseIri` as the public resource namespace, independently of the SPARQL service address.

For bearer authentication, replace `user`/`password` with `headers: { Authorization: \`Bearer ${required('SPARQL_TOKEN')}\` }`. Supply one authentication scheme appropriate to the store. Keep credentials in environment variables and avoid including their values in examples or diagnostics.

## Named clients

Core creates both stream and parsed clients for each entry:

```ts
const rows = await env.sparql.catalog.parsed.query.select(
  'SELECT ?type WHERE { ?type a <http://www.w3.org/2000/01/rdf-schema#Class> } LIMIT 10',
)
```

Use `.stream` for streaming RDF and `.parsed` for parsed query results. Pages selects a named client through a query descriptor's `endpoint` field. A custom resource loader can query a named client explicitly; the built-in own-graph and describe loaders query `default`. A named remote data source does not automatically host the API graphs or receive resource deployment.

## Dataset visibility and verification

Core's default shape lookup queries the default SPARQL dataset without wrapping patterns in `GRAPH`. Ensure the endpoint's query dataset exposes resource shapes, resource types, and class hierarchy triples needed for matching. A store's default graph may differ from the union of its named graphs. Configure the store's dataset behavior to fit the application; do not assume all endpoints provide a union default graph.

Core separately loads API graph definitions using explicit named graph IRIs. Verify both views: query the API graph with `GRAPH <apiGraphIRI>`, and query a representative shape/type in the dataset used for matching. Successful graph loading alone does not establish routing visibility.

Validate connectivity with read-only queries against the intended endpoint, then request a representative Kopflos resource. Test graph writes against a disposable target when needed. Authentication errors, missing dataset visibility, and missing write URLs require different fixes; inspect the failing operation before changing configuration.
