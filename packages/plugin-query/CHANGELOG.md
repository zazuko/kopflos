# @kopflos-cms/plugin-query

## 1.0.0

### Patch Changes

- Updated dependencies [62fb52c]
- Updated dependencies [feed750]
  - @kopflos-cms/core@0.8.0
  - @kopflos-cms/express@0.2.2

## 0.1.2

### Patch Changes

- 1bd68f5: `handlers` modules missing from package

## 0.1.1

### Patch Changes

- cd87f85: Handle `ASK` and `CONSTRUCT/DESCRIBE` queries

## 0.1.0

### Minor Changes

- d6a897c: Initial release of the Query plugin for Kopflos, providing SPARQL query proxying and a YASGUI static interface.

  Features:

  - Proxies SPARQL queries to configured endpoints.
  - Supports in-memory SPARQL endpoints directly.
  - Serves a YASGUI static page at `/-/query` with an endpoint selector.

### Patch Changes

- 2775e9d: build(deps): bump http-proxy-middleware from 3.0.5 to 3.0.7
