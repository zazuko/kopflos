---
name: kopflos-deploy-resources
description: Configure @kopflos-cms/plugin-deploy-resources and author RDF resource files for Kopflos, including file-to-IRI mapping, named graphs, startup deployment, watching, and plugin-generated resources. Use when adding or troubleshooting resource deployment in a Kopflos application.
---

# Deploy Kopflos resources

Inspect the application's `kopflos.config.*`, resource directories, and default SPARQL client. Preserve its resource IRIs and graph layout. This plugin loads RDF files and other plugins' generated resources into the default store using Talos bootstrap actions.

## Configure deployment

Add an instance to the existing configuration's `plugins` array:

```ts
import DeployResources from '@kopflos-cms/plugin-deploy-resources'

// Within the Kopflos configuration:
plugins: [
  new DeployResources({
    paths: ['resources', 'resources.dev'],
  }),
]
```

| Option    | Default         | Behavior                                                                                   |
|-----------|-----------------|--------------------------------------------------------------------------------------------|
| `paths`   | `[]`            | Directories to load; startup/manual plugin deployment falls back to `resources` when empty |
| `cwd`     | `process.cwd()` | Base directory for resolving relative `paths`                                              |
| `enabled` | `true`          | Enables startup deployment and watcher registration                                        |
| `watch`   | `true`          | Enables resource watching when Kopflos configuration `watch` is truthy                     |

`cwd` is independent of the configuration file location. Set it explicitly or use absolute paths when launching from another working directory. Multiple resource directories contribute to one dataset; do not assume a later file replaces an earlier graph without an explicit Talos policy.

The target is `env.sparql.default.stream`, which must support the required graph reads and writes. A query-only endpoint is insufficient. Default deployment replaces existing graphs represented in the input, so use a disposable/local store for validation unless deployment to another store is requested.

## Author resource files

Directory roots are stripped from the resource path. With `baseIri: 'http://localhost:1429'` and `paths: ['resources']`:

| File                         | Default graph IRI and `<>` resource IRI |
|------------------------------|-----------------------------------------|
| `resources/index.ttl`        | `http://localhost:1429/`                |
| `resources/api/index.ttl`    | `http://localhost:1429/api`             |
| `resources/person/alice.ttl` | `http://localhost:1429/person/alice`    |

For example, `resources/person/alice.ttl`:

```turtle
PREFIX schema: <http://schema.org/>

<> a schema:Person ;
  schema:name "Alice" .
```

Turtle triples go into the file's derived named graph. TriG/N-Quads can specify named graphs explicitly; those graph names are preserved. An explicit absolute subject IRI in Turtle does not change the file's default graph IRI. Keep the subject and graph aligned when using Kopflos's own-graph resource loader.

Use `/`-prefixed IRIs for application-root references and explicit absolute IRIs for external resources. RDF parsing uses the application's base IRI and Talos patches relative resource references; do not infer public IRIs from filesystem URLs. Supported formats depend on the installed RDF parsers and file media type; `.ttl` and `.trig` are established choices. `.ru` files are handled as Talos dataset updates rather than RDF resource files.

The default action for file-backed graphs is overwrite. Talos also supports merge and skip policies. In Turtle/TriG, a special prefix declaration selects the existing-resource policy for the file:

```turtle
PREFIX talos: <existingResource:merge>
```

Use `existingResource:skip` to preserve an existing graph. These are Talos loader directives, not the `urn:talos:` vocabulary namespace. Merge retains existing triples; skip leaves an existing graph untouched. Deleting a local file triggers redeployment when watched, but does not automatically delete its previously deployed graph.

## Startup, CLI, and watching

Startup calls `onStart`, deploys the assembled dataset, and optionally registers resource watchers. The watcher reacts to file changes, additions, and removals by redeploying all configured directories and then reloading API graphs. It requires both plugin `watch: true` and truthy configuration `watch`; even `watch: []` is truthy. Do not infer watcher behavior solely from `mode` or CLI `--no-watch`.

With the `kopflos` CLI, `npx kopflos deploy --config <path>` requires this plugin and an explicit, nonempty `paths` list, even though startup accepts an empty list. `enabled: false` disables automatic startup deployment; it does not disable explicit `deploy()` calls or the deploy command. Use the application's existing CLI script when available.

Missing directories are skipped with a warning. Parser failures can be logged without aborting the entire directory load. Check deployment logs and stored triples rather than treating command completion as proof that every resource loaded.

## Generated resources

The plugin combines file data with every configured plugin's `deployedResources(env)` result, which may be an RDF/JS dataset or quad stream, optionally promised. This is how Pages contributes its generated routing graph.

For a new generator, return quads in the intended named graph and include a bootstrap action in the metadata graph:

```trig
PREFIX talos: <urn:talos:>

<urn:talos:resources> {
  <https://example.org/generated> talos:action talos:overwrite .
}
<https://example.org/generated> {
  <https://example.org/generated> a <https://example.org/Resource> .
}
```

File loading assigns default actions before generator datasets are combined. A generated graph needs its own `talos:action` metadata to be selected for bootstrap. Do not expect returning arbitrary graph quads alone to deploy them.

## Verify

Deploy to a disposable store with the same `baseIri` and inspect the exact named graph and subject. For API resources, also verify that the graph is among Kopflos's loaded API graphs and request a matching endpoint. When changing watcher configuration, verify a resource edit and stop the server afterward so its watcher closes. Build-only checks do not exercise deployment.
