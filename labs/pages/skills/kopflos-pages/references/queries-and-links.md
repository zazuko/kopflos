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

Adjust the graph pattern to the application's actual storage. Declarative `queries` entries accept graph-producing CONSTRUCT and DESCRIBE executors, rather than SELECT result rows. DESCRIBE returns a graph too, but its description semantics depend on the selected SPARQL store; use CONSTRUCT when the exact returned triples must be controlled. Use `sparqlc:param(...)` bindings instead of concatenating request input into query text.

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

Use `kopflos:pageUrl(resource, relationship)` in page queries. Both arguments are required IRIs: the resource to link to and the relationship defined by the destination page's property shape. Bind the resource first, then call the function in a `BIND` within `WHERE`. Use the resulting variable in filters, projections, and CONSTRUCT templates; direct calls in FILTER or SELECT expressions are currently rejected. For a page with a `schema:mainEntity` shape:

```sparql
PREFIX schema: <http://schema.org/>
PREFIX kopflos: <https://kopflos.described.at/>

CONSTRUCT { ?person schema:mainEntityOfPage ?page }
WHERE {
  ?person a schema:Person .
  BIND(kopflos:pageUrl(?person, schema:mainEntityOfPage) AS ?page)
}
```

The generated page shapes match resource IRIs, extract variables, and materialize the corresponding HTML URL. Dictionary constraints reverse-map namespace values to route tokens. Verify a concrete resulting page URL against the file route and constraints, especially when using multiple property shapes or external resource namespaces.

Pages evaluates this extension locally with Comunica against the configured query endpoint, returning the final IRI before CONSTRUCT. The remote endpoint does not need to implement the function. The bound page IRI can also be a CONSTRUCT subject or appear under predicates unrelated to the resolution relationship.

`schema:mainEntity` and `schema:mainEntityOfPage` share resolution. Other relationships select their corresponding destination property shapes; for example, use `kopflos:pageUrl(?resource, schema:about)` for a page whose shape declares `schema:about`. Choose the relationship from the destination shape, independently of the predicate used to emit the resulting link.

No match, invalid argument types, or multiple distinct matching URLs leave the BIND variable unbound while retaining other resource data. Duplicate rules producing the same URL are accepted. Use `FILTER(BOUND(?page))` after the BIND when a link is required. To retain resources without page links, leave the variable unbound and let CONSTRUCT omit only triples that require it. Wrong argument counts are rejected before execution.

### Migrate legacy SERVICE queries

`SERVICE kopflos:Pages` is deprecated, logs a warning, and translates supported triples to the scalar function. Replace each supported triple with a BIND:

```sparql
# Before
SERVICE kopflos:Pages {
  ?resource schema:about ?page .
}

# After
BIND(kopflos:pageUrl(?resource, schema:about) AS ?page)
```

The compatibility syntax no longer enumerates multiple matching pages. Additional nested SERVICE patterns remain unsupported; express ordinary graph matching outside page resolution. Track removal in a future breaking release in [issue #378](https://github.com/zazuko/kopflos/issues/378).

Keep deployment of the `kopflos:Pages` routing-shapes graph. The deprecation concerns the SERVICE syntax; the function still uses the generated page shapes from that graph, loaded through the default endpoint even when a page data query selects a named endpoint.
