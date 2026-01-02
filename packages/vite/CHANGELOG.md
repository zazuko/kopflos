# @kopflos-cms/vite

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
