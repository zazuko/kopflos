# `@kopflos-labs/pages`

Quick-start guide for the `@kopflos-labs/pages` package, a data-driven page builder for Kopflos using Lit and RDF.

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

- **`[id].html.ts`**: The main page definition, containing the template and data logic.
- **`[id].html`**: The static HTML shell (meta tags, global styles, and basic body structure).
- **`[id].ts`**: Server-side imports, such as custom elements required for SSR.
- **`[id].client.ts`**: Client-side imports, including runtime scripts and interactive components.

#### Example: `[id].html.ts`

```typescript
import { html, definePage } from '@kopflos-labs/pages'
import plaqueQuery from './plaque.rq'

export default definePage({
  // The IRI of the main entity for this page
  mainEntity: '/plaque/[id]',
  
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

### 4. Loading Data with SPARQL (`*.rq` files)

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

### 5. Navigating the Graph with `lit-rdf`

The `@kopflos-labs/pages` plugin leverages `lit-rdf` to provide a declarative way of binding RDF data to web components.

#### Declarative Components

- **`<rdf-environment>`**: Injects the RDF environment (including namespaces and utilities) into the component tree.
- **`<data-graph>`**: Binds the results of a SPARQL query to the DOM tree.
- **`<target-node>`**: Focuses on a specific node within the current graph (usually the main resource).
- **`<traverse-graph>`**: Shifts the "focus node" by following a property path (e.g., `schema:address/schema:addressLocality`).

For full documentation, visit the [lit-rdf](https://npm.im/lit-rdf) package.

#### Creating Data-Bound Components

To create custom components that consume the RDF graph, use the `consumeEnvironment` and `consumeFocusNode` mixins from `lit-rdf/mixins.js`.

```typescript
import { consumeEnvironment, consumeFocusNode } from 'lit-rdf/mixins.js'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('my-header')
export default class extends consumeEnvironment(consumeFocusNode(LitElement)) {
  render() {
    // this.focusNode is automatically updated by parent <traverse-graph> or <target-node>
    const name = this.focusNode?.value
    
    return html`<h1>${name}</h1>`
  }
}
```

In your component, `this.focusNode` is a [`clownface` pointer](https://npm.im/clownface). You can use methods like `.out()`, `.in()`, and `.has()` to navigate further or extract values.
