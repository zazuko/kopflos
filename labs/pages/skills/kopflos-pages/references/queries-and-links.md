# Queries and resource links

For `pages/person/[id].ts`, a minimal RDF-backed definition is:

```ts
import { definePage } from '@kopflos-labs/pages'
import { html } from 'lit'
import person from './person.rq'

export default definePage({
  mainEntity: '/person/[id]',
  constraints: { id: /^[a-zA-Z0-9_-]+$/ },
  queries: { person },
  body: ({ data, env }) => html`
    <h1>${data.person
      .has(env.ns.rdf.type, env.ns.schema.Person)
      .out(env.ns.schema.name).value}</h1>
  `,
})
```

`person.rq` uses a parameterized CONSTRUCT query, matching this example's resource-per-graph storage:

```sparql
PREFIX schema: <http://schema.org/>
PREFIX sparqlc: <https://sparqlc.described.at/>

CONSTRUCT { ?s ?p ?o }
WHERE {
  BIND(IRI(sparqlc:param(schema:mainEntity)) AS ?person)
  GRAPH ?person { ?s ?p ?o }
}
```

Adjust the graph pattern to the application's actual storage. Declarative `queries` entries return RDF graphs via CONSTRUCT, rather than SELECT result rows. Use `sparqlc:param(...)` bindings instead of concatenating request input into query text.

## Query descriptors

Accepted forms include a compiled `.rq` default export, `{ query: person }`, `{ query: person, endpoint: 'analytics' }`, or `{ load: () => import('./person.rq') }`. Named endpoints must exist in configuration `sparql`; otherwise the default stream client is used.

When a query contains relative IRIs that must resolve against the API base, use:

```ts
queries: {
  person: {
    query: './person.rq',
    importMeta: import.meta,
    // endpoint: 'analytics',
  },
}
```

This lets the loader receive the application base. A bare `new URL(...)` is not a supported query descriptor in the implementation.

## Parameters

- Route variables bind as literals with literal keys: `sparqlc:param("id")`.
- Query string values bind with literal keys too; repeated values become arrays. A query string key replaces a route variable with the same key. Avoid collisions when the query depends on the route identifier.
- Page `parameters` supplies template values such as `label: '[id]-suffix'` only when the key is absent. Known CURIE keys become named nodes, but the values are literals; wrap with `IRI(...)` in SPARQL when necessary.
- `shape.property` bindings are applied last, under predicate IRI keys, and overwrite an existing binding for that predicate. Their values are named nodes. Dictionary constraints expand route tokens when filling these resource patterns.
- `mainEntity` supplies `schema:mainEntity` only when no explicit `shape` is provided. A pattern beginning with `/` uses the application namespace; use absolute resource IRIs for other namespaces.

## Resource-to-page links

Pages intercepts `SERVICE kopflos:Pages` within its page query processing; it is not a remote SPARQL service. For a page with a `schema:mainEntity` shape:

```sparql
PREFIX schema: <http://schema.org/>
PREFIX kopflos: <https://kopflos.described.at/>

CONSTRUCT { ?person schema:mainEntityOfPage ?page }
WHERE {
  ?person a schema:Person .
  SERVICE kopflos:Pages {
    ?person schema:mainEntityOfPage ?page .
  }
}
```

The generated page shapes match resource IRIs, extract variables, and materialize the corresponding HTML URL. Dictionary constraints reverse-map namespace values to route tokens. Verify a concrete resulting page URL against the file route and constraints, especially when using multiple property shapes or external resource namespaces.
