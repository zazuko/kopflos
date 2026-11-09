# RDF API definitions and handlers

With `new DeployResources({ paths: ['resources'] })` and the default API path, put the API definition in `resources/api/index.ttl`. Resource files are deployed into named graphs; the API graph is normally the application's `/api` IRI.

This example selects existing resources of type `/api/schema/Thing` and supplies a POST handler:

```turtle
PREFIX code: <https://code.described.at/>
PREFIX kl: <https://kopflos.described.at/>
PREFIX sh: <http://www.w3.org/ns/shacl#>

<> a kl:Api ;
  kl:resourceLoader kl:OwnGraphLoader .

<#thing> a kl:ResourceShape ;
  kl:api <> ;
  sh:targetClass </api/schema/Thing> ;
  kl:handler [
    a kl:Handler ;
    kl:method "POST" ;
    code:implementedBy [
      a code:EcmaScriptModule ;
      code:link <file:lib/thing.js#post>
    ]
  ] .
```

The module export is a **factory returning a handler**, not an Express middleware function:

```ts
import type { SubjectHandler } from '@kopflos-cms/core'

export const post = (): SubjectHandler => async ({ env, subject, body }) => {
  await env.sparql.default.stream.store.post(body.quadStream, {
    graph: subject.term,
  })
  return { status: 204 }
}
```

Use the application's existing TypeScript loader or compilation setup to make the linked module resolvable. `codeBase` configures the base for file code links. Factories can receive `code:arguments`; a factory requiring the Kopflos instance uses a regular function with `this`, rather than an arrow function.

Handler arguments include `env`, a Clownface `subject` pointer, `subjectVariables` from patterned targets, `query`, `headers`, and `body`. Consume `body.quadStream` for streaming RDF or await `body.dataset` for a materialized graph. Return an RDF stream/dataset/pointer or an envelope such as `{ status, headers, body }`; return text inside an envelope.

`kl:OwnGraphLoader` reads the named graph whose IRI is the requested subject. Match the stored graph layout to the selected loader. A `sh:targetClass` target requires matching RDF data; use a `kl:PatternedTarget` with `kl:regex` when the route must match an IRI independently of a resource's type. Named regex captures become `subjectVariables`.

`code:implementedBy` can be an RDF list for a handler chain. Handlers receive the previous response as a second argument; `end: true` stops the chain. GET/HEAD without an explicit subject handler returns the core representation; HEAD can reuse GET. Multiple matching resource shapes cause an error, so avoid overlapping targets.
