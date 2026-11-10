---
name: kopflos-app
description: Use when configuring, running, building, or troubleshooting an application with the kopflos CLI, including remote SPARQL endpoints, plugins, and resource deployment. For RDF resource modeling, use the core package's kopflos-resources skill when available.
---

# Build a Kopflos application

Inspect the application's `package.json`, `kopflos.config.*`, and resource directories first. Extend its existing plugins and RDF model. The executable is provided by `kopflos`; the framework types and environment come from `@kopflos-cms/core`.

## Configuration

Export a configuration from `kopflos.config.ts` or `kopflos.config.js`. The CLI discovers it with cosmiconfig; use `--config <path>` when explicit selection is needed. TypeScript execution through the CLI launcher requires `tsx` or `ts-node` on PATH; install `tsx` locally for a TypeScript application.

For a new local application, this configuration uses a disposable in-memory store. Install the packages imported by the configuration as direct dependencies; add `kopflos` and, for TypeScript, `tsx` as well.

```ts
import type { KopflosConfig } from '@kopflos-cms/core'
import { createInMemoryClients } from '@kopflos-cms/in-memory'
import DeployResources from '@kopflos-cms/plugin-deploy-resources'

export default {
  baseIri: process.env.API_BASE || 'http://localhost:1429',
  sparql: {
    default: createInMemoryClients(),
  },
  plugins: [new DeployResources({ paths: ['resources'] })],
} satisfies KopflosConfig
```

- `baseIri` identifies public resources. Set it in configuration; there is no `serve --base-iri` option. Changing the listening port does not update `baseIri`.
- `sparql.default` is required. A client entry can be an endpoint URL, endpoint options (including `endpointUrl`, `updateUrl`, `storeUrl`), or a `{ stream, parsed }` client pair. Resource deployment needs a writable default store. Add named entries for additional query endpoints.
- `apiPath` defaults to `/api`; `buildDir` defaults to `dist`. Additional `apiGraphs` identify RDF graphs containing API definitions.
- Use plugin instances in a JS/TS configuration. JSON-style configuration also supports a plugin map: module specifier to constructor options, `module#ExportName` for named exports, and `false` to disable an entry. Relative plugin modules resolve from the configuration directory.
- `variables` provides values to code loaders and `env.kopflos.variables`. Repeated `serve --variable name=value` options override configured values with strings.
- CLI `watch` paths resolve from the configuration directory. The deploy-resources plugin resolves resource paths from its `cwd`, which defaults to the process working directory; set `cwd` when running elsewhere.

## Remote SPARQL endpoints

Replace the in-memory default with endpoint options when using a remote store. For example, within the configuration:

```ts
sparql: {
  default: {
    endpointUrl: process.env.SPARQL_QUERY_URL,
    updateUrl: process.env.SPARQL_UPDATE_URL,
    storeUrl: process.env.SPARQL_STORE_URL,
    user: process.env.SPARQL_USER,
    password: process.env.SPARQL_PASSWORD,
  },
  catalog: 'https://data.example.org/sparql',
},
```

Require the query URL in the application's configuration validation, and require the update/store URLs for operations that use them. These URLs are supplied by the store; Kopflos does not derive update or Graph Store URLs from the query URL. `endpointUrl` serves SPARQL queries, `updateUrl` serves SPARQL Update, and `storeUrl` serves the Graph Store Protocol. A URL string is shorthand for a query endpoint only. `baseIri` remains the public API identity, independently of the remote database address.

Endpoint options are passed to `sparql-http-client`. For bearer authentication, use `headers: { Authorization: \`Bearer ${process.env.SPARQL_TOKEN}\` }` instead of `user`/`password`; keep credentials in the environment and validate required values before use.

The default client handles core routing, API graph loading, built-in loaders, and resource deployment. A named client such as `catalog` is available as `env.sparql.catalog.stream` and `.parsed`; Pages queries select it with `{ query: catalogQuery, endpoint: 'catalog' }`. Adding a named endpoint does not move API definitions or change the default deployment target. Check remote dataset visibility when class targets or API shapes fail to match.

## Run and build

```sh
npx kopflos serve --mode development
npx kopflos build
npx kopflos serve --mode production
```

Development enables watching by default. `--watch` and `--no-watch` override that behavior; add application code directories to configuration `watch` as needed. Serve defaults to production mode, port `1429`, and host `0.0.0.0`; `--port` and `--host` change the listener. Keep the configuration's `mode`, if present, consistent with the requested CLI mode.

`build` invokes configured plugin build hooks. It does not compile arbitrary application TypeScript; retain the application's own compilation step when needed. Build assets before serving a production Pages application.

`npx kopflos deploy` deploys resources using the configured deploy-resources plugin and requires an explicit, nonempty `paths` list. Serving with that plugin also deploys on startup by default. Deployment writes to the configured default store; select a local/disposable store for validation unless deployment to another store is part of the request.

## Custom plugin data loading

Implement `KopflosPlugin` from `@kopflos-cms/core` and add the instance to the configuration. Core runs the plugins' `onStart(instance)` hooks concurrently and waits for that phase before the CLI opens the HTTP listener. It invokes `onReady(instance)` after the listener opens; those hooks also run concurrently. Array order is not a dependency barrier within either phase. Load request-critical data in an awaited startup path; an asynchronous `onReady` import can leave a window where requests arrive before its data is available. A successful listen message alone does not prove the import finished.

For bootstrap-managed data, use `deployedResources(env)` as described by the deploy-resources skill. A plugin can instead write directly through `instance.env.sparql.default.stream.store.put(quadStream, { graph })`. These writes are independent of file deployment and its overwrite policies. Keep the metadata subject IRI, its storage graph IRI, and a vocabulary namespace graph explicit: a metadata subject stored under another graph is not an own-graph representation of that subject. Use `kl:DescribeLoader`, an appropriate custom loader, or aligned local resource subjects when exposing it through an API.

Decide how partial imports affect readiness. Catching and logging each failed write while resolving the hook permits startup with incomplete data; rejecting a startup hook reports a failed startup. Verify expected graphs and representative query results, not just process exit status. Direct store writes do not themselves reload core's cached API definitions; call `instance.loadApiGraphs()` when changing routing graphs after they have been loaded.

## Define RDF endpoints

Read [references/rdf-api.md](references/rdf-api.md) when adding resource shapes, handlers, or diagnosing routing. Kopflos selects handlers from RDF API definitions rather than an Express route table.

## Verify the requested behavior

Use the application's scripts and a local store. Start in development mode, request the actual resource IRI with the appropriate `Accept` header, and inspect the response and server logs. For production asset changes, build and check a production request too.

For a 404, check the public IRI, loaded API graphs, and resource shape target. For a 405, check the method and handler definition. For a 500, inspect ambiguous shape matches, module loading, and endpoint errors. A successful build alone does not verify deployed API graphs or runtime requests.
