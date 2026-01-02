# kopflos

## 0.1.8

### Patch Changes

- accad6e: Removed the type `KopflosPluginConstructor` and now all plugins are exported as classes directly and their options are passed to the constructor
- cdbb172: Adopt a simpler definition of a plugin where all methods are instance methods. Kopflos instance is passed as parameter
- 5295694: build(deps): bump express from 5.0.1 to 5.2.0
- Updated dependencies [accad6e]
- Updated dependencies [2472e18]
- Updated dependencies [cdbb172]
- Updated dependencies [5295694]
- Updated dependencies [accad6e]
  - @kopflos-cms/core@0.6.0
  - @kopflos-cms/plugin-deploy-resources@0.2.0
  - @kopflos-cms/express@0.2.0

## 0.1.7

### Patch Changes

- c33a135: Use `tsx` if it is available in PATH

## 0.1.6

### Patch Changes

- Updated dependencies [3f737fd]
  - @kopflos-cms/core@0.5.0
  - @kopflos-cms/express@0.1.4

## 0.1.5

### Patch Changes

- 6b3f86a: New plugin hook: `onReady`

## 0.1.4

### Patch Changes

- 3370532: Plugins are now implemented as classes
- Updated dependencies [3370532]
  - @kopflos-cms/express@0.1.2

## 0.1.3

### Patch Changes

- 11cc57c: Allow plugins to be defined using paths relative to config path

## 0.1.2

### Patch Changes

- e4893c1: Watch mode
- Updated dependencies [e4893c1]
- Updated dependencies [e4893c1]
  - @kopflos-cms/express@0.1.1
  - @kopflos-cms/plugin-deploy-resources@0.1.1

## 0.1.1

### Patch Changes

- 8c44b44: Directory `lib/deploy` wasn't packed

## 0.1.0

### Minor Changes

- 1fcb2c0: First version
- d79814c: Updated `@hydrofoil/talos-core` to v0.3

### Patch Changes

- 67ba100: Added CHANGELOG.md to build
- 67ba100: Running `kopflos build` is now possible with incomplete configuration
- 67ba100: Removed debug logs
- 6fb4851: Do not require bash to be installed
- 916a5f8: Added `kopflos deploy` command
- 3e30f38: Added `--variable <key=value>` option to override config variables
- fd489b3: Added plugin with `onStart` hook
- 6775ad1: Added `--mode (development|production)` option
- Updated dependencies [fd489b3]
- Updated dependencies [67ba100]
- Updated dependencies [3e30f38]
- Updated dependencies [916a5f8]
- Updated dependencies [67ba100]
- Updated dependencies [b94672f]
- Updated dependencies [1fcb2c0]
- Updated dependencies [67ba100]
- Updated dependencies [3a227e5]
- Updated dependencies [14705ba]
- Updated dependencies [fd489b3]
- Updated dependencies [fd489b3]
- Updated dependencies [67ba100]
- Updated dependencies [facbd83]
- Updated dependencies [730ecc2]
- Updated dependencies [730ecc2]
- Updated dependencies [d79814c]
- Updated dependencies [1b4a7fc]
  - @kopflos-cms/plugin-deploy-resources@0.1.0
  - @kopflos-cms/express@0.1.0
  - @kopflos-cms/logger@0.1.0

## 0.1.0-beta.2

### Patch Changes

- 6fb4851: Do not require bash to be installed

## 0.1.0-beta.1

### Patch Changes

- 67ba100: Added CHANGELOG.md to build
- 67ba100: Running `kopflos build` is now possible with incomplete configuration
- 67ba100: Removed debug logs
- Updated dependencies [67ba100]
- Updated dependencies [67ba100]
- Updated dependencies [67ba100]
- Updated dependencies [67ba100]
  - @kopflos-cms/plugin-deploy-resources@0.1.0-beta.1
  - @kopflos-cms/express@0.1.0-beta.6
  - @kopflos-cms/logger@0.1.0-beta.1

## 0.1.0-beta.0

### Minor Changes

- 1fcb2c0: First version

### Patch Changes

- 3e30f38: Added `--variable <key=value>` option to override config variables
- fd489b3: Added plugin with `onStart` hook
- 6775ad1: Added `--mode (development|production)` option
- Updated dependencies [fd489b3]
- Updated dependencies [730ecc2]
- Updated dependencies [3e30f38]
- Updated dependencies [1fcb2c0]
- Updated dependencies [3e30f38]
- Updated dependencies [3e30f38]
- Updated dependencies [1fcb2c0]
- Updated dependencies [a72254b]
- Updated dependencies [fd489b3]
- Updated dependencies [fd489b3]
- Updated dependencies [be93e5a]
- Updated dependencies [730ecc2]
- Updated dependencies [3e30f38]
  - @kopflos-cms/plugin-deploy-resources@0.1.0-beta.0
  - @kopflos-cms/express@0.1.0-beta.5
  - @kopflos-cms/core@0.3.0-beta.9
