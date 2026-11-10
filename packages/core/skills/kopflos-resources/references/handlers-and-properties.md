# Handlers and property resources

## Bind an HTTP method

Add `kl:handler` to the resource shape. A handler's `code:implementedBy` points to a module export that is a factory returning the request handler:

```turtle
PREFIX kl: <https://kopflos.described.at/>
PREFIX code: <https://code.described.at/>

<https://example.org/api#person>
  kl:handler [
    a kl:Handler ;
    kl:method "PUT" ;
    code:implementedBy [
      a code:EcmaScriptModule ;
      code:link <file:lib/person.js#put>
    ]
  ] .
```

For replacing a person's own-graph representation, the linked module can export:

```ts
import type { SubjectHandler } from '@kopflos-cms/core'

export const put = (): SubjectHandler => async ({ env, subject, body }) => {
  await env.sparql.default.stream.store.put(body.quadStream, {
    graph: subject.term,
  })
  return { status: 204 }
}
```

Ensure the application's loader or compilation setup can resolve the linked module. File code links resolve using configuration `codeBase`, which defaults to the process working directory. Package exports use links such as `<node:some-package/handlers.js#exportName>`.

Factories can receive positional arguments through `code:arguments ( "value" )`. To access the Kopflos instance in a factory, use a regular function with a typed `this: Kopflos`; an arrow function does not receive the bound instance.

Request handler arguments include:

- `env`, including RDF helpers, namespaces, SPARQL clients, and application variables.
- `subject`, a Clownface pointer into the loaded core representation.
- `subjectVariables`, populated from named patterned-target captures.
- `body.quadStream`, or `await body.dataset` for materialized request RDF; `body.raw` exposes the incoming message.
- `query`, `headers`, and the selected `resourceShape` and `handler` RDF pointers.
- `property` and `object` for a property resource request.

Return an RDF stream, dataset, or pointer, or a response envelope such as `{ status: 200, headers: { 'content-type': 'text/plain' }, body: 'Hello' }`. Put string response bodies inside an envelope. Return a result for every branch; an undefined handler result becomes a 500 response.

Use an RDF list for `code:implementedBy` when chaining implementations. Core runs list entries in order and passes the previous response envelope as the second handler argument. Return `end: true` to stop the chain. HEAD reuses GET if there is no explicit HEAD handler.

## Define a property resource

A property shape can attach method handlers to a resource reached through an RDF predicate. For example, Alice links to her friends resource:

```turtle
PREFIX schema: <http://schema.org/>

<https://example.org/person/alice>
  schema:knows <https://example.org/person/alice/friends> .
```

Add a property shape to the parent resource shape:

```turtle
PREFIX kl: <https://kopflos.described.at/>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX schema: <http://schema.org/>
PREFIX code: <https://code.described.at/>

<https://example.org/api#person>
  sh:property [
    sh:path schema:knows ;
    kl:handler [
      kl:method "GET" ;
      code:implementedBy [
        a code:EcmaScriptModule ;
        code:link <file:lib/person.js#getFriends>
      ]
    ]
  ] .
```

Requesting `/person/alice/friends` matches the object of Alice's `schema:knows` triple. Core loads the parent subject's representation and invokes the property handler with Alice as `subject`, `schema:knows` as `property`, and the friends IRI as `object`. This is a relationship-based endpoint, not automatic path concatenation.

The default property lookup follows simple predicate paths and parent shapes targeted by node or class. Do not assume complex SHACL paths or patterned parent targets work for this lookup. Property GET needs its own handler; the subject GET fallback does not apply. Avoid also exposing the property object's IRI through another matching shape, which would create an ambiguous match.
