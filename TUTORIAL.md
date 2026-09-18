# Tutorial: Building a Headless CMS with Kopflos

Kopflos is a headless, RDF-rich CMS that allows you to build data-centric applications using Semantic Web technologies. This tutorial will guide you through the process of building a simple API and frontend, based on the [example](example/) project.

---

## 1. Prerequisites

Before starting, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (latest LTS)
- [Docker](https://www.docker.com/) (optional, if you want to use a persistent database like Oxigraph or Virtuoso)

---

## 2. Project Setup

Create a new directory for your project and initialize it:

```bash
mkdir my-kopflos-app
cd my-kopflos-app
npm init -y
npm install @kopflos-cms/core @kopflos-cms/in-memory @kopflos-cms/plugin-deploy-resources @kopflos-cms/express @kopflos-cms/vite @kopflos-cms/hydra @kopflos-cms/shacl @kopflos-labs/pages
```

---

## 3. Configuration (`kopflos.config.ts`)

The heart of a Kopflos application is the configuration file. It defines your data sources, plugins, and environment.

Create a `kopflos.config.ts` file in your project root:

```typescript
import { KopflosConfig } from '@kopflos-cms/core'
import { createInMemoryClients } from '@kopflos-cms/in-memory'
import DeployResources from '@kopflos-cms/plugin-deploy-resources'
import Hydra from '@kopflos-cms/hydra'
import PluginPages from '@kopflos-labs/pages'

const baseIri = process.env.API_BASE || 'http://localhost:1429'

export default <KopflosConfig>{
  baseIri,
  sparql: {
    // We'll use an in-memory database for this tutorial
    default: createInMemoryClients(),
  },
  plugins: [
    // Automatically deploy RDF resources from a directory to the database
    new DeployResources({
      paths: ['resources'],
    }),
    // Enable Hydra API documentation
    new Hydra(),
    // Data-driven page builder
    new PluginPages(),
  ],
}
```

---

## 4. Defining Resources and API

Kopflos uses RDF to define both the data and the API structure.

### Data Resources

Create a directory `resources` and add a sample data file `plaques.ttl`:

```turtle
@prefix schema: <http://schema.org/> .

<http://localhost:1429/plaque/newton-apple>
  a <http://localhost:1429/api/schema/Plaque> ;
  schema:name "Newton's Apple Tree" ;
  schema:text "A cutting from the original tree..." .
```

### API Definition

You can define your API structure using Turtle files. Create `resources/api/index.ttl`:

```turtle
@prefix kl: <https://kopflos.described.at/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .

<>
  a kl:Api ;
  kl:resourceLoader kl:OwnGraphLoader .

<#plaque>
  a kl:ResourceShape ;
  kl:api <> ;
  sh:targetClass <http://localhost:1429/api/schema/Plaque> .
```

---

## 5. Custom Business Logic (Handlers)

Sometimes you need custom server-side logic. Kopflos allows you to attach "Handlers" to your resources.

1.  **Define the handler in RDF** (update `resources/api/index.ttl`):

```turtle
@prefix code: <https://code.described.at/> .

<#plaque>
  kl:handler [
    a kl:Handler ;
    kl:method "POST" ;
    code:implementedBy [
      a code:EcmaScriptModule ;
      code:link <file:lib/plaque.js#post> ;
    ]
  ] .
```

2.  **Implement the handler in TypeScript** (`lib/plaque.ts`):

```typescript
import { SubjectHandler } from '@kopflos-cms/core'

export const post = (): SubjectHandler => async (req) => {
  // Store the incoming RDF stream into the default SPARQL store
  await req.env.sparql.default.stream.store.post(req.body.quadStream, {
    graph: req.subject.term,
  })

  return { status: 204 }
}
```

---

## 6. Building the Frontend

The `@kopflos-labs/pages` plugin lets you build pages that are automatically mapped to your RDF resources.

Create a file `pages/plaque/[id].ts`:

```typescript
import { html, definePage } from '@kopflos-labs/pages'

export default definePage({
  mainEntity: '/plaque/[id]',
  
  // A simple SPARQL query to fetch the plaque's data
  queries: {
    plaque: (params) => `
      PREFIX schema: <http://schema.org/>
      CONSTRUCT { ?s ?p ?o }
      WHERE {
        BIND(<http://localhost:1429/plaque/${params.id}> as ?s)
        ?s ?p ?o .
      }`
  },

  // Define how the page looks using Lit-style templates
  body({ env }) {
    return html`
      <rdf-environment>
        <data-graph data-graph="plaque">
          <target-node target-class="http://localhost:1429/api/schema/Plaque">
            <header>
              <traverse-graph property-path="schema:name">
                <resource-label></resource-label>
              </traverse-graph>
            </header>
            <main>
              <resource-label property="schema:text"></resource-label>
            </main>
          </target-node>
        </data-graph>
      </rdf-environment>`
  },
})
```

---

## 7. Running the Application

Add the following scripts to your `package.json`:

```json
"scripts": {
  "start": "kopflos serve --mode development"
}
```

Run the server:

```bash
npm start
```

Your API and frontend should now be running at `http://localhost:1429`.

- **API Documentation**: `http://localhost:1429/api`
- **Newton's Apple Page**: `http://localhost:1429/plaque/newton-apple`

---

## Summary

In this tutorial, you've learned how to:
1. Configure Kopflos with an in-memory database.
2. Deploy RDF data and define an API using Turtle.
3. Add custom server-side logic with Handlers.
4. Create data-driven frontend pages with `@kopflos-labs/pages`.
