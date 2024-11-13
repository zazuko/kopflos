# @kopflos-cms/express

## 0.1.0

### Minor Changes

- fd489b3: First version
- 1fcb2c0: The main export now returns `Promise<{ middleware: RequestHandler; instance: Kopflos }>`
- fd489b3: Added express-only middleware hooks

### Patch Changes

- 67ba100: Added CHANGELOG.md to build
- 3e30f38: Support for direct stream, using Web Streams
- 67ba100: Plugin dir wasn't packaged
- b94672f: Body is now always present in handler argument. Use `this.body.isRdf` to check if it can be parsed as RDF according to the Accept header. `this.body.raw` now returns the `IncomingMessage` object to allow parsing bodies using [`co-body`](https://npm.im/co-body) or similar.
- 3a227e5: First version
- 14705ba: Adding support for accessing request body
- fd489b3: Added plugin with `onStart` hook
- facbd83: build(deps): bump express from 4.19.2 to 4.20.0
- 730ecc2: Ensure that middlewares from multiple plugins are registered in order
- 1b4a7fc: After first request, the server would stop responding
- Updated dependencies [730ecc2]
- Updated dependencies [67ba100]
- Updated dependencies [619d7f2]
- Updated dependencies [3e30f38]
- Updated dependencies [b691125]
- Updated dependencies [77cfe87]
- Updated dependencies [1fcb2c0]
- Updated dependencies [14705ba]
- Updated dependencies [fe2793d]
- Updated dependencies [b72086f]
- Updated dependencies [673f9a2]
- Updated dependencies [3e30f38]
- Updated dependencies [2b107ef]
- Updated dependencies [3e30f38]
- Updated dependencies [67ba100]
- Updated dependencies [13f029c]
- Updated dependencies [b94672f]
- Updated dependencies [528bfd2]
- Updated dependencies [1b8a2bc]
- Updated dependencies [0b960fa]
- Updated dependencies [67ba100]
- Updated dependencies [a72254b]
- Updated dependencies [a11dda5]
- Updated dependencies [14705ba]
- Updated dependencies [2ee7a70]
- Updated dependencies [fd489b3]
- Updated dependencies [67bd393]
- Updated dependencies [be93e5a]
- Updated dependencies [3e30f38]
- Updated dependencies [730ecc2]
  - @kopflos-cms/core@0.3.0
  - @kopflos-cms/logger@0.1.0

## 0.1.0-beta.6

### Patch Changes

- 67ba100: Added CHANGELOG.md to build
- 67ba100: Plugin dir wasn't packaged
- Updated dependencies [67ba100]
- Updated dependencies [67ba100]
- Updated dependencies [67ba100]
  - @kopflos-cms/core@0.3.0-beta.10
  - @kopflos-cms/logger@0.1.0-beta.1

## 0.1.0-beta.5

### Minor Changes

- fd489b3: First version
- 1fcb2c0: The main export now returns `Promise<{ middleware: RequestHandler; instance: Kopflos }>`
- fd489b3: Added express-only middleware hooks

### Patch Changes

- 3e30f38: Support for direct stream, using Web Streams
- fd489b3: Added plugin with `onStart` hook
- 730ecc2: Ensure that middlewares from multiple plugins are registered in order
- Updated dependencies [730ecc2]
- Updated dependencies [3e30f38]
- Updated dependencies [1fcb2c0]
- Updated dependencies [3e30f38]
- Updated dependencies [3e30f38]
- Updated dependencies [a72254b]
- Updated dependencies [fd489b3]
- Updated dependencies [be93e5a]
- Updated dependencies [3e30f38]
- Updated dependencies [730ecc2]
  - @kopflos-cms/core@0.3.0-beta.9
  - @kopflos-cms/logger@0.1.0-beta.0

## 0.0.1-beta.4

### Patch Changes

- facbd83: build(deps): bump express from 4.19.2 to 4.20.0
- Updated dependencies [b72086f]
  - @kopflos-cms/core@0.3.0-beta.8

## 0.0.1-beta.3

### Patch Changes

- b94672f: Body is now always present in handler argument. Use `this.body.isRdf` to check if it can be parsed as RDF according to the Accept header. `this.body.raw` now returns the `IncomingMessage` object to allow parsing bodies using [`co-body`](https://npm.im/co-body) or similar.
- Updated dependencies [2b107ef]
- Updated dependencies [b94672f]
- Updated dependencies [67bd393]
  - @kopflos-cms/core@0.3.0-beta.6

## 0.0.1-beta.2

### Patch Changes

- 14705ba: Adding support for accessing request body
- Updated dependencies [b691125]
- Updated dependencies [14705ba]
- Updated dependencies [14705ba]
- Updated dependencies [2ee7a70]
  - @kopflos-cms/core@0.3.0-beta.5

## 0.0.1-beta.1

### Patch Changes

- 1b4a7fc: After first request, the server would stop responding
- Updated dependencies [673f9a2]
  - @kopflos-cms/core@0.3.0-beta.2

## 0.0.1-beta.0

### Patch Changes

- 3a227e5: First version
- Updated dependencies [77cfe87]
- Updated dependencies [528bfd2]
  - @kopflos-cms/core@0.3.0-beta.0
