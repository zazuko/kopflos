---
name: kopflos-pages
description: Use when building or troubleshooting RDF-backed HTML pages in a Kopflos application with @kopflos-labs/pages, including file routes, Lit SSR, SPARQL data, resource-to-page links, and hydration.
---

# Build Kopflos Pages

Inspect `kopflos.config.*` and neighboring page files before editing. Preserve the application's RDF model and component conventions.

## Register the plugin

Import the default Pages plugin from `@kopflos-labs/pages` and add `new Pages()` to the existing `plugins` array. Its `path` option defaults to `pages`, relative to the configuration directory. Keep a configured SPARQL default client and a resource deployment mechanism: Pages generates RDF routing shapes through its `deployedResources` hook, and registers the `kopflos:Pages` API graph itself. The deploy-resources plugin gathers those generated resources at deployment/startup.

## Create a file route

Define a page in a `.ts` module with a default export calling `definePage`. Discovery checks for the text `definePage` in the source; keep that call visible in the page module.

```ts
import { definePage } from '@kopflos-labs/pages'
import { html } from 'lit'

export default definePage({
  body: () => html`<h1>Hello</h1>`,
})
```

Import `html` from `lit` (or `lit-html`); Pages exports `definePage` and page types, not `html`.

In page module templates, use only attribute bindings (for example, `value=${value}`), never property bindings (`.value=${value}`). Property bindings are not recreated on the client after SSR and cause hydration mismatches.

Routes use HTML suffixes: `pages/person/[id].ts` serves `/person/<id>.html`; `pages/index.ts` serves `/index.html` and `/`. Nested `index.ts` pages also match the directory URL. `[id]`, `[[id]]`, and `[...path]` declare required, optional, and catch-all variables. Do not assume extensionless routes for other filenames. The default catch-all accepts slashes and word characters; add constraints if other characters are needed.

Use these companion files when needed:

| File             | Purpose                                                                            |
|------------------|------------------------------------------------------------------------------------|
| `[id].ts`        | `definePage`, body, head, queries, shapes, constraints                             |
| `[id].html`      | HTML shell, metadata, global styles; include it for a production client entrypoint |
| `[id].html.ts`   | Component registrations imported during SSR and in the browser                     |
| `[id].client.ts` | Browser-only imports and behavior                                                  |

Vite injects imports for companion modules and hydration support into the HTML shell. Keep browser-only code out of SSR imports. Page discovery excludes `.client.ts` and `.html.ts` files.

## Bind RDF data

Read [references/queries-and-links.md](references/queries-and-links.md) for SPARQL descriptors, parameter binding, and links from RDF resources to HTML pages.

- `body(args)` returns a Lit template, synchronously or asynchronously. `args` contains Kopflos handler arguments plus `data`, whose query entries are Clownface pointers.
- `head` is a string or a function returning a string, optionally asynchronously. It is inserted as HTML; escape untrusted values before interpolation.
- `shape.property` maps RDF predicates to resource IRI patterns. `mainEntity: '/person/[id]'` is shorthand for a `schema:mainEntity` property shape. This describes the resource represented by the page, independently of the page file's route.
- Constraints accept a regex **without flags**, an allowed string array, or a key-to-IRI dictionary. Dictionaries map route keys to resource namespaces and reverse-map resource IRIs to page URLs. Invalid route values return 404 before companion SSR imports and query execution.

For optional `lit-rdf` integration, register its components in `.html.ts` and bind query results with `<rdf-graph data-graph="person">` inside `<rdf-environment>` / `<rdf-dataset>`. Match `data-graph` exactly to a `queries` key. Use `<target-node>` and `<traverse-graph>` to focus the graph for child components. Pages serializes graphs consumed by components with `data-graph` for browser hydration; a server-side `data` lookup alone does not expose the graph to the client.

## SSR and verification

Pages defers hydration by default. For components that cannot run `connectedCallback` during SSR, configure `ssrOptions.disallowConnectedCallback` with tag names or regexes. An `allowConnectedCallback` list, when present, permits only matching components; a deny match still takes precedence. An empty allow list permits none.

Run `kopflos serve --mode development` through the application's existing script and verify the actual `.html` route, invalid route values, rendered data, and client interaction. Run `kopflos build` before checking production mode; output defaults to `dist/pages/client` and `dist/pages/server` (subject to `buildDir` and plugin `path`).

If a page is missing, check discovery, generated routing graph deployment, and the HTML route suffix. If HTML has no data, check query bindings and endpoint selection. If SSR works but client interaction fails, check companion imports and browser errors. If only production fails, check build output and the HTML shell entrypoint.
