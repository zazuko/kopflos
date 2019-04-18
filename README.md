# hydra-box

[Hydra](http://www.hydra-cg.com/spec/latest/core/) is a machine readable description for APIs.
Hydra Box extends the API description with links to the actual code, which provides the API.
Hydra Box will use such an API description to start a server which provides the API and dynamically loads the required code for it.

## Getting started

Hydra-box API is an [expressjs](https://expressjs.com) middleware. Three main steps are necessary to set it up:

1. Create a Hydra `ApiDocumentation` graph
1. Add terms to declare how specific operations are implemented
1. Create an express application using hydra-box

For the sake of this tutorial, let's assume that the entrypoint and base URI of all resources is `https://example.app/` and
the terms will be within an `https://example.app/api#` namespace.

### Create a Hydra `ApiDocumentation` graph

First step is to create the API Documentation which describes the types and operations which the API supports. 
This is easiest done by hand-crafting a static RDF file. It can be serialized in any format supported by 
[`rdf-ext`](https://github.com/rdf-ext/rdf-ext).
For the case of this example, turtle will be used.

#### Create initial API Documentation

Start by creating a `hydra/api.ttl` file in your project.

```sh
mkdir hydra
touch api.ttl
```

In this graph, add a `hydra:ApiDocumentation` resource and link it to the entrypoint. The entrypoint is required as per
the Hydra specification.

```diff
+@base <https://example.app/> .
+@prefix hydra: <http://www.w3.org/ns/hydra/core#> .

+<api> a hydra:ApiDocumentation ;
+  hydra:entrypoint <> .
```

Note the id of the API Documentation being `https://example.app/api`. The relative path can be anything. Remember the chosen
name as it will be important later to correctly bootstrap the application in JS.

#### Declare implementation of the entrypoint resource

To have client discover that they can request the entrypoint resource, its details must be added to the documentation document.
This is done by adding a `SupportedClass` and a `GET` `SupportedOperation`. Optionally, both can use `hydra:title` or 
`hydra:description` properties to give some human-readable information about the individual resources and operations.

```diff
-  hydra:entrypoint <> .
+  hydra:entrypoint <> ;
+  hydra:supportedClass <api#Entrypoint> .

+<api#Entrypoint> a hydra:Class ;
+  hydra:title "The root of the API" ;
+  hydra:descripton "Request this to start navigating the API" ;
+  hydra:supportedOperation [
+  a hydra:SupportedOperation ;
+    hydra:title "Get the entrypoint resource" ;
+    hydra:method "GET"
+  ]
```

## Add terms to declare how specific operations are implemented

The graph created so far is not enough for hydra-box to serve just yet. It needs to know what code to execute
when a supported resource is requested.

Currently, the only built-in method is to link an operation to a SPARQL query which will be executed against an underlying store.

```diff
@prefix hydra: <http://www.w3.org/ns/hydra/core#> .
+@prefix code: <https://code.declared.at/> .
+@prefix hydra-box: <http://hydra-box.org/schema/> .

    hydra:title "Get the entrypoint resource" ;
-    hydra:method "GET"
+    hydra:method "GET" ;
+    code:implementedBy [
+      a hydra-box:SparqlQuery ;
+      code:link <file:hydra/entrypoint.get.sparql>
+    ]
```

The simplest possible content of the `hydra/entrypoint.get.sparql` file is a `DESCRIBE <https://example.app/>` query.

Fianally, an explicit declaration of the type of the entrypoint resource is necessary so that hydra-box can set up 
the express router.

```diff
+<> a <api#Entrypoint> .
```

## Create an express application using hydra-box

With the first operation and its implementation declared, it's time to create a minimal express app in `server.js` file.

```js
const path = require('path')
const express = require('express')
const hydraBox = require('hydra-box')

function hydraMiddleware () {
  return hydraBox.fromUrl('/api', 'file://' + path.join(__dirname, 'hydra/api.ttl'), {
    sparqlEndpointUrl: 'http://example.app/sparql',
    contextHeader: '/context/'
  })
}

Promise.resolve()
  .then(async () => {
    const app = express()
    app.use(await hydraMiddleware())
    app.listen(9090)
  })
  .catch(err => console.error(err))
```

Few things to notice here:

* The `hydraBox.fromUrl` method takes a `file://` URL and not a filesystem path. It means that also a remote graph can be used
* The aforementioned method is async, hence the `Promise.resolve()` wrapping the bootstrap
* Its first argument is the desired path to the API Documentation resource. It must match the one used earlier
* Not shown here, `cors` is immediately necessary to expose `Link` headers to browser clients outside your domain
