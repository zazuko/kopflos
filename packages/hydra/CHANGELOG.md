# @kopflos-cms/hydra

## 0.2.1

### Patch Changes

- c1a1f48: When the member identifier could not be generated, 500 is sent instead 400
- c1a1f48: Updated `@tpluscode/rdf-ns-builders` to allow v4+
- c1a1f48: Updated `sparqlalgebrajs` to v5.0.2
- c1a1f48: Updated `@zazuko/env` to v3
- c1a1f48: Updated `@hydrofoil/shape-to-query` to v0.15
- c1a1f48: Updated `rdf-literal` to v2
- Updated dependencies [c1a1f48]
- Updated dependencies [fb10e4b]
- Updated dependencies [c1a1f48]
- Updated dependencies [c1a1f48]
- Updated dependencies [c1a1f48]
- Updated dependencies [c1a1f48]
  - @kopflos-cms/core@0.7.0

## 0.2.0

### Minor Changes

- accad6e: Removed the type `KopflosPluginConstructor` and now all plugins are exported as classes directly and their options are passed to the constructor

### Patch Changes

- cdbb172: Adopt a simpler definition of a plugin where all methods are instance methods. Kopflos instance is passed as parameter
- Updated dependencies [accad6e]
- Updated dependencies [cdbb172]
  - @kopflos-cms/core@0.6.0

## 0.1.7

### Patch Changes

- a4443d9: Updated `@hydrofoil/shape-to-query`

## 0.1.6

### Patch Changes

- 2b37739: Improve shapes graph for hydra Collections

## 0.1.5

### Patch Changes

- bfc7e90: `hydra:Collection`: `sh:shapesGraph` can be used to import shapes used in `kl-hydra:memberShape` and `kl-hydra:memberCreateShape`
- bfc7e90: Update `@kopflos-cms/shacl` to use `sh:shapesGraph`
- Updated dependencies [bfc7e90]
  - @kopflos-cms/core@0.5.2

## 0.1.4

### Patch Changes

- 21b4319: Assign partial collection view URI
- Updated dependencies [bab5fc1]
- Updated dependencies [e1c91d1]
  - @kopflos-cms/core@0.5.1

## 0.1.3

### Patch Changes

- Updated dependencies [3f737fd]
  - @kopflos-cms/core@0.5.0

## 0.1.2

### Patch Changes

- 6328d5c: Collections: support `kl-hydra:memberCreateShape` and `kl-hydra:memberQueryShape` which can be used instead of `kl-hydra:memberShape` to separate querying from validation

## 0.1.1

### Patch Changes

- a95d3f7: Some files missing from package

## 0.1.0

### Minor Changes

- dcddc48: Support for sending `POST` requests to a `hydra:Collection`
- 67c5db0: Configurable SPARQL Endpoint to use for fetching collection members
- b84bd82: Created extensible method for collection paging strategies
- be60b63: Support for `hydra:Collection` resource shapes

### Patch Changes

- Updated dependencies [ad51eef]
- Updated dependencies [b84bd82]
- Updated dependencies [b84bd82]
- Updated dependencies [be60b63]
- Updated dependencies [67c5db0]
- Updated dependencies [608724b]
  - @kopflos-cms/core@0.4.0
