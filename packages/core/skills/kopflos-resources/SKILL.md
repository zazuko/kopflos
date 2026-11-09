---
name: kopflos-resources
description: Define Kopflos resources and HTTP behavior in RDF with @kopflos-cms/core, including APIs, resource shapes, SHACL targets, resource loaders, property resources, and handler bindings. Use when modeling an RDF API or troubleshooting resource matching and representations.
---

# Define Kopflos resources

Inspect existing API graphs, application configuration, resource data, and handler modules. Preserve the application's vocabulary and public IRIs. Kopflos's default routing is driven by RDF resource shapes; use those definitions when adding endpoints.

## Resource model

Keep these roles distinct:

| Term                | Role                                                                         |
|---------------------|------------------------------------------------------------------------------|
| Resource IRI        | Public identity requested over HTTP                                          |
| `kl:Api`            | API definition associated with a set of resource shapes                      |
| `kl:ResourceShape`  | Selects resources and defines their loader, handlers, and property resources |
| SHACL target        | Determines which resource IRIs match a shape                                 |
| `kl:resourceLoader` | Loads the resource's core RDF representation                                 |
| `kl:handler`        | Implements an HTTP method for a resource or property resource                |

Here `kl:` means `https://kopflos.described.at/`. A resource shape defines behavior separately from the resource's data. A domain class definition alone does not expose instances as a Kopflos endpoint, and an RDF routing shape alone is not a SHACL validation workflow.

## Define an API and a resource shape

This example exposes existing `schema:Person` resources with their own-graph RDF representation:

```turtle
PREFIX kl: <https://kopflos.described.at/>
PREFIX schema: <http://schema.org/>
PREFIX sh: <http://www.w3.org/ns/shacl#>

<https://example.org/api>
  a kl:Api ;
  kl:resourceLoader kl:OwnGraphLoader .

<https://example.org/api#person>
  a kl:ResourceShape ;
  kl:api <https://example.org/api> ;
  sh:targetClass schema:Person .
```

Store Alice's representation in the named graph `https://example.org/person/alice`:

```trig
PREFIX schema: <http://schema.org/>

<https://example.org/person/alice> {
  <https://example.org/person/alice>
    a schema:Person ;
    schema:name "Alice" .
}
```

Store the API definition in a configured API graph. The default API IRI is `baseIri` plus `apiPath` (default `/api`); it is also loaded as an API graph. Configuration `apiGraphs` and plugin `apiGraphs()` add graph IRIs to load. Keep the shape's `kl:api` pointing to the API node, rather than the shape or resource IRI.

The default shape lookup runs a SPARQL query against `env.sparql.default.parsed`; API definitions, relevant resource types, and class hierarchy triples must be visible to that query's dataset. Core also loads API graph triples into its in-memory dataset for handler and loader resolution. Merely adding a Turtle file to the project does not populate either store: use the application's resource deployment mechanism.

## Remote endpoint configuration

Read [references/remote-endpoints.md](references/remote-endpoints.md) when configuring a remote SPARQL store, authentication, or named clients. `sparql.default` supplies core's routing and built-in resource loaders; its query dataset must expose the triples needed to match resources, independently of where their named graph representations are stored.

## Choose a target

- `sh:targetNode <resourceIRI>` selects that exact resource without requiring stored type triples.
- `sh:targetClass schema:Person` selects typed instances, including instances of subclasses via `rdfs:subClassOf*`. This depends on the stored type and hierarchy data.
- `sh:target [ a kl:PatternedTarget ; kl:regex "..." ]` selects by resource IRI pattern without requiring a type assertion. Named captures become `subjectVariables` in handlers.

For example, a route for a resource that may not exist yet:

```turtle
PREFIX kl: <https://kopflos.described.at/>
PREFIX sh: <http://www.w3.org/ns/shacl#>

<https://example.org/api#draft>
  a kl:ResourceShape ;
  kl:api <https://example.org/api> ;
  sh:target [
    a kl:PatternedTarget ;
    kl:regex "^https://example[.]org/draft/(?<id>[^/]+)$"
  ] .
```

Anchor patterns when a complete IRI match is intended. The default SPARQL lookup matches regexes case-insensitively; JavaScript extracts named groups separately without that flag, so keep casing consistent when captures matter. These are regexes, not Pages `[id]` file-route templates.

The default lookup supports the target forms above; do not assume every SHACL target mechanism is implemented. Avoid overlapping shape matches: core returns an error for multiple candidates rather than choosing a more specific shape.

## Choose the representation

Loader resolution checks `kl:resourceLoader` on the resource shape, then its API, then the API's `kl:config` node. If none resolves, core uses the own-graph loader.

- `kl:OwnGraphLoader` constructs all triples from the named graph whose IRI equals the selected subject IRI. A subject appearing in another graph does not make that graph its representation.
- `kl:DescribeLoader` executes `DESCRIBE <subjectIRI>`; the endpoint determines the description semantics.
- A custom loader is a `code:EcmaScriptModule` binding whose export implements `ResourceLoader`: `(iri, instance) => RDF quad stream`. Unlike handlers, loaders are loaded as functions directly, not called as factories first.

For a matched subject resource with no explicit handler, GET and HEAD return the core representation. Other methods need handlers. An empty own graph can therefore yield an empty successful representation; check graph layout when data is unexpectedly missing.

## Add methods and property resources

Read [references/handlers-and-properties.md](references/handlers-and-properties.md) when adding HTTP methods, handler arguments or chains, or endpoints reached through an RDF property.

## Verify

Use a local store and request a concrete resource IRI. Check the matching shape, named graph contents, response status, and RDF response. For class targets, include a typed resource; for patterned targets, check capture values and an invalid IRI. A 404 means no shape matched, a 405 means no applicable method handler was found, and a 500 can indicate overlapping shapes, a code-loading failure, or an endpoint error. Changing only a file does not verify that deployed API graphs were refreshed.
