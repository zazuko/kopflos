# `@kopflos-labs/pages`

Quick-start guide for the `@kopflos-labs/pages` package, a data-driven page builder for Kopflos using Lit and RDF.

## AI skill

The package includes [kopflos-pages](skills/kopflos-pages/SKILL.md), an agent skill for authoring pages, SPARQL data, and Lit SSR components. It is shipped in `node_modules/@kopflos-labs/pages/skills/kopflos-pages`; point your agent at its `SKILL.md` or copy the folder into your agent's skills directory.

---

### 1. Installation

Install the package via npm:

```bash
npm install @kopflos-labs/pages
```

---

### 2. Configuration in `kopflos.config.(js|ts)`

To use the plugin, you must register it in your Kopflos configuration. For the time being, it is necessary to include the standard Pages API graph to ensure pages can be served correctly.

```typescript
import PluginPages from '@kopflos-labs/pages'

const baseIri = process.env.API_BASE || 'http://localhost:1429'

export default {
  baseIri,
  plugins: [
    new PluginPages({
      // Optional:
      ssrOptions: {
        // if present, do not call connectedCallback on these custom elements
        disallowConnectedCallback: [
          /^sl-/, // e.g., Shoelace components
        ],
        // if present, only call connectedCallback on these custom elements
        allowConnectedCallback: [],
        // for other SSR options, consult '@lir-labs/ssr package
      },
    }),
  ],
}
```

---

### 3. Creating Pages (Multi-file structure)

By default, pages are located in a `pages/` directory, relative to the config. For dynamic routes such as `plaque/[id]`, you can split the page into several files for better organization:

- **`[id].ts`**: The main page definition, containing the template and data logic.
- **`[id].html`**: The static HTML shell (meta tags, global styles, and basic body structure).
- **`[id].html.ts`**: Server-side imports, such as custom elements required for SSR.
- **`[id].client.ts`**: Client-side imports, including runtime scripts and interactive components.

#### Example: `[id].ts`

```typescript
import { html, definePage } from '@kopflos-labs/pages'
import { schema } from '@tpluscode/rdf-ns-builders'
import plaqueQuery from './plaque.rq'

export default definePage({
  // Define SHACL property shapes linking resources to this page
  shape: {
    property: [
      {
        path: schema.mainEntity,
        pattern: '/plaque/[id]',
      },
    ],
  },

  // Route variable constraints
  constraints: {
    id: /^[a-zA-Z0-9_-]+$/,
  },
  
  // Data sources: query results will be available in the 'data' object
  queries: {
    plaque: plaqueQuery,
  },
  
  // Dynamic <head> content
  head({ env, data }) {
    const name = data.plaque
      .has(env.ns.rdf.type, env.kopflos.appNs('/api/schema/Plaque'))
      .out(env.ns.schema.name).value

    return `<title>${name} ::: Read the Plaque</title>`
  },
  
  // Page body template
  body({ env }) {
    const PlaqueClass = env.kopflos.appNs('/api/schema/Plaque')
    
    return html`
      <rdf-environment>
        <data-graph data-graph="plaque">
          <target-node target-class="${PlaqueClass.value}">
            <header>
              <traverse-graph property-path="schema:name">
                <my-header></my-header>
              </traverse-graph>
            </header>
            <!-- Page content goes here -->
          </target-node>
        </data-graph>
      </rdf-environment>`
  },
})
```

---

### 4. Page Shapes and Route Constraints

Pages in `@kopflos-labs/pages` can define SHACL-like property shapes and route variable constraints to declaratively map RDF resources to pages and validate incoming URLs.

#### Defining `shape`

The `shape` property declares how RDF resources relate to this page:

```typescript
import { definePage } from '@kopflos-labs/pages'
import { schema } from '@tpluscode/rdf-ns-builders'

export default definePage({
  shape: {
    property: [
      {
        path: schema.mainEntity,
        pattern: '/plaque/[id]',
      },
      {
        path: schema.about,
        pattern: '/about/[category]',
      },
    ],
  },
  // ...
})
```

- **`path`**: The RDF property (e.g. `schema.mainEntity`, `schema.about`, or any custom predicate).
- **`pattern`**: A URI template using route variables (e.g. `/plaque/[id]` or `[prefix][term]`). Absolute URIs (starting with `http`) are used directly; relative patterns are resolved against the app namespace (`env.kopflos.appNs`).
- **Backward compatibility**: You can still provide `mainEntity: '/plaque/[id]'` as a shorthand, which is normalized to `shape: { property: [{ path: schema.mainEntity, pattern: '/plaque/[id]' }] }`.

#### Defining `constraints`

Route parameters can be validated and transformed using the `constraints` object:

```typescript
import { definePage } from '@kopflos-labs/pages'
import { schema } from '@tpluscode/rdf-ns-builders'
import { prefixes } from '@zazuko/vocabularies'

export default definePage({
  constraints: {
    // 1. Dictionary mapping (Record<string, string>)
    // Bi-directional mapping: URL token 'schema' <-> URI 'http://schema.org/'
    prefix: prefixes,

    // 2. Regular Expression (RegExp)
    // Validates route parameter format
    term: /^[a-zA-Z0-9_-]+$/,

    // 3. Allowed Value List (string[] or readonly string[])
    // Restricts the variable to an exact set of values
    lang: ['en', 'de', 'fr'],
  },
  shape: {
    property: [
      {
        path: schema.mainEntity,
        pattern: '[prefix][term]',
      },
    ],
  },
})
```

##### Supported Constraint Types:
1. **Dictionary (`Record<string, string>`)**:
   - Route URL pattern matches dictionary keys (e.g. `schema`, `foaf`).
   - Resource URI pattern matches dictionary values (e.g. `http://schema.org/`, `http://xmlns.com/foaf/0.1/`).
   - Enables bi-directional translation: incoming URLs map key to namespace URI, and outgoing SPARQL/stream results map namespace URI back to route key.
2. **Regular Expression (`RegExp`)**:
   - Matches route parameter values against the regex pattern.
   - Compiled into capture groups in route and resource regular expressions.
3. **Array (`string[]` / `readonly string[]`)**:
   - Matches route parameter values against the allowed list of string values.

#### Early Route Validation & 404

When handling an incoming request, the server extracts `subjectVariables` and validates them against `constraints`. If any variable fails validation (e.g. an unknown prefix or an invalid term format), the handler immediately returns `404 Not Found` without loading SSR modules or running SPARQL queries.

---

### 5. Loading Data with SPARQL (`*.rq` files)

You can maintain your SPARQL queries in separate `.rq` files. These queries are automatically parameterized. Use the `sparqlc:param` function to bind URL parameters (like `id`) or the `mainEntity` IRI.

#### Example: `plaque.rq`

```sparql
PREFIX schema: <http://schema.org/>
PREFIX sparqlc: <https://sparqlc.described.at/>

CONSTRUCT {
  ?s ?p ?o
} {
  # Bind the page's main entity IRI to a variable
  BIND(IRI(sparqlc:param(schema:mainEntity)) as ?plaque)
  
  GRAPH ?plaque {
    ?s ?p ?o
  }
}
```

Queries defined in the `queries` object of `definePage` are executed, and the resulting RDF graphs are provided to the frontend via the `<data-graph>` component.

> Currently, only `CONSTRUCT` queries are supported for declarative data binding.

---

### 6. Configuring `queries`

The `queries` option of `definePage` lets you declare one or more data sources that will be executed server‑side and exposed to your page via the `data` argument.

Each entry under `queries` supports multiple forms:

- Direct function (default export of a `.rq` file compiled by `sparqlc`)
- Object with `query` execute function (imported statically)
- Object with `query` as string (imported dynamically)
  - this method is necessary when the query uses relative URI references which will be resolved against API base URL 
- Object with `load` (lazy/dynamic import)
- Optional `endpoint` to target a named SPARQL client instead of the default

#### Supported forms

```ts
import { definePage, html } from '@kopflos-labs/pages'
import plaqueQuery from './plaque.rq' // ExecuteConstruct

export default definePage({
  // 1) Direct function
  queries: {
    plaque: plaqueQuery,

    // 2) Explicit object with `query`
    plaqueExplicit: { query: plaqueQuery },

    // 3) Select a named endpoint (must exist in env.sparql)
    plaqueOnNamed: { query: plaqueQuery, endpoint: 'analytics' },

    // 4) Lazy load (declarative dynamic import)
    plaqueRelative: {
      query: './plaque.rq',
      importMeta: import.meta,
    },

    // 5) Lazy load (imperative dynamic import)
    lazyPlaque: {
      endpoint: 'readonly',
      load: () => import('./plaque.rq'),
    },
    
    // 6) Lazy load (declarative)
    //    also allowed as object with `query/endpoint` properties
    lazyPlaqueDeclarative: new URL('./plaque.rq', import.meta.url),
  },

  body() {
    return html`...`
  },
})
```

Note: import attributes cannot be used in `load` function until vite supports them. 
See [discussion](https://github.com/vitejs/vite/discussions/18534). To resolve relative URL references
against the API base, pass the query path as URL as shown in the last example.

When using `endpoint`, the query runs against `env.sparql[endpoint].stream`. If omitted, the default client `env.sparql.default.stream` is used.

#### Parameter binding into queries

All queries receive a parameter map that is available to `sparqlc:param(...)` inside your `.rq` files. Parameters are populated from several sources, merged in the following order (later items do not overwrite earlier ones):

1) Route variables from the page path
- Example route: `pages/plaque/[id].ts` ⇒ `id` is available
- Bound as literal values under their plain names: `sparqlc:param("id")`
- If a route variable has a dictionary constraint (e.g. `prefix: { schema: 'http://schema.org/' }`), the resolved mapped URI is also populated for shape pattern evaluation.

2) URL query string parameters (HTTP GET)
- Arrays are supported and bound as multiple literal values
- Empty values are skipped, but the string `'0'` is kept
- Example: `?tags=foo&tags=bar&empty=&zero=0` ⇒
  - `sparqlc:param("tags")` → `("foo", "bar")`
  - `sparqlc:param("zero")` → `"0"`

3) `parameters` map in the page definition (template expansion)
- You can provide additional parameters that are only set if not already present from (1) or (2)
- Keys may be plain strings or CURIEs (e.g., `schema:about`). CURIEs are expanded using known prefixes
- Values support simple template substitution with the page variables, using `[var]`

```ts
export default definePage({
  // Bind the page's mainEntity and add custom parameters
  parameters: {
    'schema:about': 'http://example.org/[slug]', // CURIE key, absolute IRI value
    'custom': '[slug]-suffix',                    // plain key, string value
  },
  queries: { details: plaqueQuery },
})
```

In your query you can then read:

```sparql
BIND(sparqlc:param(schema:about) AS ?about)
BIND(sparqlc:param("custom") AS ?suffix)
```

4) `shape.property` bindings (and `mainEntity`)
- For each property declared in `shape.property`, the template pattern is evaluated with resolved variables and bound under its predicate path (e.g. `schema.mainEntity`, `schema.about`).
- If using the `mainEntity` shorthand property, it binds `schema:mainEntity`.
- In your query, you can access these bindings via `sparqlc:param(schema:mainEntity)`, `sparqlc:param(schema:about)`, etc.

Summary of precedence when setting a parameter key:
- If a key is already present from route variables or query string, `parameters` will not overwrite it
- `shape.property` and `mainEntity` bindings are populated after route/query parameters.

---

### 7. Resource-to-Page Routing with `kopflos:pageUrl`

`@kopflos-labs/pages` maintains a graph of page resource shapes (`kopflos:Pages`). Resolve a resource to its HTML page IRI with `kopflos:pageUrl`:

```sparql
PREFIX schema: <http://schema.org/>
PREFIX kopflos: <https://kopflos.described.at/>

CONSTRUCT {
  ?resource schema:mainEntityOfPage ?pageUrl ;
            ?p ?o .
}
WHERE {
  ?resource ?p ?o .
  BIND(kopflos:pageUrl(?resource, schema:mainEntityOfPage) AS ?pageUrl)
}
```

Call `kopflos:pageUrl` within a `BIND` expression in `WHERE`. Nested and sibling calls are supported, including `BIND(CONCAT(STR(kopflos:pageUrl(?resource, schema:about)), "#details") AS ?url)`. Calls may also use the result of another `pageUrl` call. Intermediate bindings stay within the originating BIND scope. Use the resulting variables in further expressions, filters, projections, and templates; direct calls outside BIND remain unsupported.

Both arguments are required and must evaluate to IRIs: the resource and the relationship declared in the destination page's property shape. `schema:mainEntityOfPage` also matches shapes declaring `schema:mainEntity`; custom relationships such as `schema:about` match their corresponding property shapes.

Pages evaluates the function locally with Comunica, using the configured query endpoint for RDF data. It matches resource patterns, extracts named capture groups, and reverse-maps dictionary alternatives to generate the destination page IRI. The IRI is available during query evaluation, including in filters and any position in the CONSTRUCT template. This is a Pages extension, not a function installed on your remote SPARQL endpoint.

No match, invalid argument types, or multiple distinct matching URLs cause an expression error: `BIND` leaves the destination variable unbound and retains the other bindings. Add `FILTER(BOUND(?pageUrl))` if a matching page is required. Duplicate rules producing the same URL are accepted. Calls with missing or extra arguments also cause an expression error, leaving the BIND variable unbound.

`SERVICE kopflos:Pages { }` is deprecated and rewritten as `BIND` statements. This syntax will be removed in a future breaking release; watch [the removal issue](https://github.com/zazuko/kopflos/issues/378).

---

### 8. Navigating the Graph with `lit-rdf`

It is recommended to use `lit-rdf` with  `@kopflos-labs/pages` to provide a declaratively bind RDF data to web components.

#### Declarative Components

- **`<rdf-environment>`**: Injects the RDF environment (including namespaces and utilities) into the component tree.
- **`<rdf-graph>`**: Binds the results of a SPARQL query to the DOM tree.
- **`<rdf-dataset>`**: Collects graphs into `rdf-graph` elements as an RDF/JS Dataset and exposes to its children.
- **`<target-node>`**: Focuses on a specific node within the current graph (usually the main resource).
- **`<traverse-graph>`**: Shifts the "focus node" by following a property path (e.g., `schema:address/schema:addressLocality`).

For full documentation, visit the [lit-rdf](https://npm.im/lit-rdf) package.

#### Creating Data-Bound Components

To create a page which consumes and navigates graph data, use the `lit-rdf` as shown below in the page `body`.
The `data-graph` attribute specifies the name of the graph to bind to the component. It must match the
entries of the `queries` object introduced above.

```html
<rdf-environment>
  <rdf-dataset>
    <rdf-graph data-graph="person">
    </rdf-graph>
    <rdf-graph data-graph="project">
    </rdf-graph>
    
    <target-node target-class="schema:Person">
      <my-header></my-header>
      
      <my-content></my-content>
    </target-node>
  </rdf-dataset>
</rdf-environment>
```

To remove boilerplate, `<rdf-environment>` and `<rdf-dataset>` would typically be used in a root component
which defined the overall page structure. Prefer composition to inheritance.

To create custom components that consume the RDF graph, use the `FocusNode` controller from `lit-rdf/controllers.js`.

```typescript
import { FocusNode } from 'lit-rdf/controllers.js'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('my-header')
export default class extends LitElement {
  declare focusNode: FocusNode

  constructor() {
    super()
    this.focusNode = new FocusNode()
  }

  render() {
    // this.focusNode is automatically updated by parent <traverse-graph> or <target-node>
    const name = this.focusNode.pointer?.value
    
    return html`<h1>${name}</h1>`
  }
}
```

In your component, `this.focusNode.pointer` is a [`clownface` pointer](https://npm.im/clownface). You can use methods like `.out()`, `.in()`, and `.has()` to navigate further or extract values.
