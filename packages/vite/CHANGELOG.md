# @kopflos-cms/vite

## 0.3.1

### Patch Changes

- 5ca6fa4: Resolve `configPath` against the kopflos' base path

## 0.3.0

### Minor Changes

- c1a1f48: Plugin configuration: `root`/`entrypoints`/`outDir` options moved to `build`, which can be single object or an array. If absent, nothing will be built. This way multiple builds can be configured.
- c1a1f48: `@kopflos-cms/vite/template.js` now does not require a previous step but loads a file provided in argument. The file path will be resolved against the correct root/build path depending on running `dev`/prod` environment

### Patch Changes

- c1a1f48: Plugin authors can now derive from `VitePlugin` to provide build configurations
- c1a1f48: Build: `entrypoints` will be resolved against the `root` option of its respective build configuration
- c1a1f48: Updated `@zazuko/env` to v3

## 0.2.2

### Patch Changes

- 17ef296: Loading config from the right path

## 0.2.1

### Patch Changes

- 46491b5: Relative `configPath` option will be resolved against `basePath` from kopflos environment.
- 0c33953: Build plugin command now receives `KopflosEnvironment` as argument

## 0.2.0

### Minor Changes

- accad6e: Removed the type `KopflosPluginConstructor` and now all plugins are exported as classes directly and their options are passed to the constructor

### Patch Changes

- 6511af6: build(deps): bump glob from 11.0.0 to 11.1.0
- 4214fce: Added an accessor to the `ViteDevServer` the plugin instance
- cdbb172: Adopt a simpler definition of a plugin where all methods are instance methods. Kopflos instance is passed as parameter
- 5295694: build(deps): bump express from 5.0.1 to 5.2.0

## 0.1.2

### Patch Changes

- 175c538: Add inline `config` to plugin config
- 3370532: Plugins are now implemented as classes

## 0.1.1

### Patch Changes

- aef55d4: build(deps): bump vite from 6.0.7 to 6.0.9

## 0.1.0

### Minor Changes

- 5b6b1ab: Update vite to v6

## 0.0.1

### Patch Changes

- 67ba100: Added CHANGELOG.md to build
- 730ecc2: Ensure the the `outDir` setting is also used for serving files in in production mode
- 87f4e96: The plugin populates a variable `VITE.basePath` which will be resolved to the correct path in development and production mode
- 67ba100: Added type augmentation of plugin config interface
- 1b8a2bc: Serve the entire UI build statically. Before, `public` vite resources would not be accessible
- Updated dependencies [67ba100]
- Updated dependencies [730ecc2]
  - @kopflos-cms/logger@0.1.0

## 0.0.1-beta.2

### Patch Changes

- 87f4e96: The plugin populates a variable `VITE.basePath` which will be resolved to the correct path in development and production mode
- 1b8a2bc: Serve the entire UI build statically. Before, `public` vite resources would not be accessible

## 0.0.1-beta.1

### Patch Changes

- 67ba100: Added CHANGELOG.md to build
- 67ba100: Added type augmentation of plugin config interface
- Updated dependencies [67ba100]
  - @kopflos-cms/logger@0.1.0-beta.1

## 0.0.1-beta.0

### Patch Changes

- 730ecc2: Ensure the the `outDir` setting is also used for serving files in in production mode
- Updated dependencies [730ecc2]
  - @kopflos-cms/logger@0.1.0-beta.0
