# @kopflos-cms/core

## 0.5.2

### Patch Changes

- bfc7e90: Include `handler` graph pointer in `HandlerArgs`

## 0.5.1

### Patch Changes

- bab5fc1: Export `Variables` interface to allow module augmenting
- e1c91d1: Export `DecoratorCallback`

## 0.5.0

### Minor Changes

- 3f737fd: Request Decorators are now implemented as classes

## 0.4.1

### Patch Changes

- 6b3f86a: New plugin hook: `onReady`

## 0.4.0

### Minor Changes

- b84bd82: Changed plugin setup to require classes

### Patch Changes

- ad51eef: Log API dataset to TRACE
- b84bd82: Added helper to easily access plugin instance
- be60b63: Added a `/ns.js` module which exports the kopflos namespace builder
- 67c5db0: Added `kl:endpoint` predicate
- 608724b: Added request decorators

## 0.3.3

### Patch Changes

- 7aa216f: `KopflosEnvironment` is also added as `this` context of handler factory

## 0.3.2

### Patch Changes

- dbc9de5: Added `handlers.js` module with `getCoreRepresentation` handler

## 0.3.1

### Patch Changes

- e4893c1: Changed static method `Kopflos.fromGraphs` to `Kopflos#loadApiGraphs`
- e4893c1: New plugin hooks: `onStop` and `apiTriples`

## 0.3.0

### Minor Changes

- 77cfe87: Reboot library agnostic of express or other host
- 3e30f38: Handlers: Added support for `code:arguments`. Please refer to [rdf-loader-code](https://github.com/zazuko/rdf-loader-code?tab=readme-ov-file#loading-function-arguments) for more information.

  ```turtle
  [
    a kl:Handler ;
    code:implementedBy [
      a code:EcmaScriptModule ;
      code:link <...> ;
      code:arguments ("foo" "bar") ;
    ] ;
  ] .
  ```

  Implementors must now return a factory function that returns the handler function.

  ```diff
  import type { Handler } from "@kopflos-cms/core";

  - export default function handler() {
  + export default function handler(foo, bar): Handler {
    return async function handlerFunction() {
      // ...
    };
  }
  ```

### Patch Changes

- 730ecc2: Extracted logger to a new package `@kopflos-cms/core`
- 67ba100: Added CHANGELOG.md to build
- 619d7f2: Object request would be incorrectly handled by subject handler
- 3e30f38: Support for direct stream, using Web Streams
- b691125: Made the resource shape query explicitly require type `kl:ResourceShape`
- 1fcb2c0: Revert dependency on `anylogger` to stable v1 branch
- 14705ba: More precise typing of core interfaces
- fe2793d: Missing resources in package
- b72086f: Allow initializing clients from one instance of `StreamClient` or `ParsingClient`
- 673f9a2: When handling object requests, Core Representation of the object was loaded instead of subject
- 3e30f38: Added support for templated resource shapes. Use `kl:regex` a pattern to match the request URL path.
  Additionally, named capturing groups can be used to extract values from the URL path. They will be
  accessible as `HandlerArgs#subjectVariables` and included when resolving `code:EcmaScriptTemplateLiteral`.

  ```turtle
  <#WebPage>
    a kl:ResourceShape ;
    kl:api <> ;
    sh:target
      [
        a kl:PatternedTarget ;
        kl:regex "/(?<type>[^/]+).+\\.html$" ;
      ] ;
    kl:handler
      [
        a kl:Handler ;
        kl:method "GET" ;
        code:implementedBy
          [
            a code:EcmaScriptModule ;
            code:link <node:@kopflos-cms/serve-file#default> ;
            code:arguments ( "pages/${type}.html"^^code:EcmaScriptTemplateLiteral ) ;
          ] ;
      ] ;
  .
  ```

- 2b107ef: Catch errors in kopflos handler and send as a 500 response
- 67ba100: Plugin dir wasn't packaged
- 13f029c: feat: add logging
- b94672f: Body is now always present in handler argument. Use `this.body.isRdf` to check if it can be parsed as RDF according to the Accept header. `this.body.raw` now returns the `IncomingMessage` object to allow parsing bodies using [`co-body`](https://npm.im/co-body) or similar.
- 528bfd2: Implemented SPARQL-base Resource Shape lookup
- 1b8a2bc: Added `env.kopflos.variables` to allow accessing and setting variables
- 0b960fa: Fixes runtime error when executing logged queries
- a72254b: Object of `kl:handler` can now be an RDF List of handler implementations which will be called in sequence
- a11dda5: Improve logging and error handling
- 14705ba: Adding support for accessing request body
- 2ee7a70: Allow a multiple values of `kl:method` on a handler
- fd489b3: Added plugin with `onStart` hook
- 67bd393: Expose request headers to kopflos handler
- be93e5a: Added `./env.js` to package exports
- 3e30f38: Added support for `code:EcmaScriptTemplateLiteral`
- Updated dependencies [67ba100]
- Updated dependencies [730ecc2]
  - @kopflos-cms/logger@0.1.0

## 0.3.0-beta.11

### Patch Changes

- 1b8a2bc: Added `env.kopflos.variables` to allow accessing and setting variables

## 0.3.0-beta.10

### Patch Changes

- 67ba100: Added CHANGELOG.md to build
- 67ba100: Plugin dir wasn't packaged
- Updated dependencies [67ba100]
  - @kopflos-cms/logger@0.1.0-beta.1

## 0.3.0-beta.9

### Minor Changes

- 3e30f38: Handlers: Added support for `code:arguments`. Please refer to [rdf-loader-code](https://github.com/zazuko/rdf-loader-code?tab=readme-ov-file#loading-function-arguments) for more information.

  ```turtle
  [
    a kl:Handler ;
    code:implementedBy [
      a code:EcmaScriptModule ;
      code:link <...> ;
      code:arguments ("foo" "bar") ;
    ] ;
  ] .
  ```

  Implementors must now return a factory function that returns the handler function.

  ```diff
  import type { Handler } from "@kopflos-cms/core";

  - export default function handler() {
  + export default function handler(foo, bar): Handler {
    return async function handlerFunction() {
      // ...
    };
  }
  ```

### Patch Changes

- 730ecc2: Extracted logger to a new package `@kopflos-cms/core`
- 3e30f38: Support for direct stream, using Web Streams
- 1fcb2c0: Revert dependency on `anylogger` to stable v1 branch
- 3e30f38: Added support for templated resource shapes. Use `kl:regex` a pattern to match the request URL path.
  Additionally, named capturing groups can be used to extract values from the URL path. They will be
  accessible as `HandlerArgs#subjectVariables` and included when resolving `code:EcmaScriptTemplateLiteral`.

  ```turtle
  <#WebPage>
    a kl:ResourceShape ;
    kl:api <> ;
    sh:target
      [
        a kl:PatternedTarget ;
        kl:regex "/(?<type>[^/]+).+\\.html$" ;
      ] ;
    kl:handler
      [
        a kl:Handler ;
        kl:method "GET" ;
        code:implementedBy
          [
            a code:EcmaScriptModule ;
            code:link <node:@kopflos-cms/serve-file#default> ;
            code:arguments ( "pages/${type}.html"^^code:EcmaScriptTemplateLiteral ) ;
          ] ;
      ] ;
  .
  ```

- a72254b: Object of `kl:handler` can now be an RDF List of handler implementations which will be called in sequence
- fd489b3: Added plugin with `onStart` hook
- be93e5a: Added `./env.js` to package exports
- 3e30f38: Added support for `code:EcmaScriptTemplateLiteral`
- Updated dependencies [730ecc2]
  - @kopflos-cms/logger@0.1.0-beta.0

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
