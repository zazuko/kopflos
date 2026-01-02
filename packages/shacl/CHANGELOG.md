# @kopflos-cms/shacl

## 0.3.0

### Minor Changes

- accad6e: Removed the type `KopflosPluginConstructor` and now all plugins are exported as classes directly and their options are passed to the constructor

### Patch Changes

- cdbb172: Adopt a simpler definition of a plugin where all methods are instance methods. Kopflos instance is passed as parameter
- Updated dependencies [accad6e]
- Updated dependencies [cdbb172]
  - @kopflos-cms/core@0.6.0

## 0.2.1

### Patch Changes

- 504e7b6: Allow additional arguments passed to `sh:shapesGraph` code reference

## 0.2.0

### Minor Changes

- bfc7e90: Drop `shacl#shapeSelector` term and use `sh:shapesGraph` instead

### Patch Changes

- bfc7e90: Update `rdf-validate-shacl` to gain support for `owl:imports`
- Updated dependencies [bfc7e90]
  - @kopflos-cms/core@0.5.2

## 0.1.2

### Patch Changes

- 40f479c: Added a `loadDataGraph` option which lets API authors customize the data graph before validation

## 0.1.1

### Patch Changes

- a95d3f7: Some files missing from package

## 0.1.0

### Minor Changes

- bd6aa25: SHACL Validation decorator
