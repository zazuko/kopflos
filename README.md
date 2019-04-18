# hydra-box

[Hydra](http://www.hydra-cg.com/spec/latest/core/) is a machine readable description for APIs.
Hydra Box extends the API description with links to the actual code, which provides the API.
Hydra Box will use such an API description to start a server which provides the API and dynamically loads the required code for it.

## Getting started

A hydra-box API is essentially an [expressjs](https://expressjs.com) app where hydra-box is yet another middleware. To set
it up three main steps are necessary:

1. Create a Hydra `ApiDocumentation` graph
1. Add hydra-box terms to declare how specific operations are implemented
1. Create an express application using hydra-box
1. Implement the Hydra's operations as decalred by the graph

For the sake of this tutorial, let's assume that the entrypoint and base URI of all resources is `https://example.app/` and
the terms will be within an `https://examle.app/api#` namespace.

### Create a Hydra `ApiDocumentation` graph

First step is to create the API Documentation which describes the types and operations which the API supports. 
This is easiest done by hand-crafting a static RDF file. It can be serialized in any format supported by `rdf-ext`.
For the case of this example, turtle will be used.

#### Create initial API Documentation

Start by creating a `hydra/api.ttl` file in your project.

```sh
mkdir hydra
touch api.ttl
```

In this graph, add a `hydra:ApiDocumentation` resource and a link to the entrypoint. The entrypoint is required as per
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

To have client discover that they can request the entrypoint resource, its details must be added to the documention document.
This is done by adding a `SupportedClass` and a `GET` `SupporteOperation`. Optionally, both can use `hydra:title` or 
`hydra:description` properties to give some human-readable information about the resources in question.

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

## Add hydra-box terms to declare how specific operations are implemented

The graph created so far is not enough for hydre-box to serve resources yet. It needs to know what code to execute
when a matching request is performed.

The simplest, built-in method is to link an operation to a SPARQL query which will be executed against an underlying store.

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

The simples possible content of the `entrypoint.get.sparql` file is a `DESCRIBE <https://example.app/>` query.

Fianally, an explicit declaration of the type of the entrypoint resource is necessary so that hydra-box can set up 
the express router

```diff
+<> a <api#Entrypoint> .
```
