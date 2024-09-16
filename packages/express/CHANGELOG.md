# @kopflos-cms/express

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
