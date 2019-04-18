# hydra-box

[Hydra](http://www.hydra-cg.com/spec/latest/core/) is a machine readable description for APIs.
Hydra Box extends the API description with links to the actual code, which provides the API.
Hydra Box will use such an API description to start a server which provides the API and dynamically loads the required code for it.

## Getting started

A hydra-box API is essentially an [expressjs](https://expressjs.com) app where hydra-box is yet another middleware. To set
it up three main steps are necessary:

1. Create a Hydra `ApiDocumentation` graph
1. Create a javascript 
1. Add hydra-box terms to declare how specific operations are implemented
1. Hook up code implementing the Hydra's operations

For the sake of this tutorial, let's assume tha the entrypoint and base URI of all resources is `https://example.app/` and
the terms will be within an `https://examle.app/vocab#` namespace.

### Create a Hydra `ApiDocumentation` graph

First step is to create the API Documentation which describes the types and operations which the API supports. 
This is easiest done by hand-crafting a static RDF file. It can be serialized in any format supported by `rdf-ext`.
For the case of this example, turtle will be used.

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
