# @kopflos-cms/core

## 0.3.0-beta.8

### Patch Changes

- b72086f: Allow initializing clients from one instance of `StreamClient` or `ParsingClient`

## 0.3.0-beta.7

### Patch Changes

- a11dda5: Improve logging and error handling

## 0.3.0-beta.6

### Patch Changes

- 2b107ef: Catch errors in kopflos handler and send as a 500 response
- b94672f: Body is now always present in handler argument. Use `this.body.isRdf` to check if it can be parsed as RDF according to the Accept header. `this.body.raw` now returns the `IncomingMessage` object to allow parsing bodies using [`co-body`](https://npm.im/co-body) or similar.
- 67bd393: Expose request headers to kopflos handler

## 0.3.0-beta.5

### Patch Changes

- b691125: Made the resource shape query explicitly require type `kl:ResourceShape`
- 14705ba: More precise typing of core interfaces
- 14705ba: Adding support for accessing request body
- 2ee7a70: Allow a multiple values of `kl:method` on a handler

## 0.3.0-beta.4

### Patch Changes

- 0b960fa: Fixes runtime error when executing logged queries

## 0.3.0-beta.3

### Patch Changes

- 619d7f2: Object request would be incorrectly handled by subject handler
- 13f029c: feat: add logging

## 0.3.0-beta.2

### Patch Changes

- 673f9a2: When handling object requests, Core Representation of the object was loaded instead of subject

## 0.3.0-beta.1

### Patch Changes

- fe2793d: Missing resources in package

## 0.3.0-beta.0

### Minor Changes

- 77cfe87: Reboot library agnostic of express or other host

### Patch Changes

- 528bfd2: Implemented SPARQL-base Resource Shape lookup

## 0.2.1

### Patch Changes

- 41951d7: Changed the generic interface to allow extending the runtime environment

## 0.2.0

### Minor Changes

- ed24e8d: RDF/JS Environment must be passed explicitly when initialising an API

### Patch Changes

- ed24e8d: `Api` exported also as interface

## 0.1.1

### Patch Changes

- d00c3c3: Remove TS sources from package

## 0.1.0

### Minor Changes

- First release, renamed from `hydra-box`
