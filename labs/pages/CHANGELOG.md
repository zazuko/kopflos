# @kopflos-labs/pages

## 0.2.6

### Patch Changes

- a729303: Adds a way to declare page queries using module reference (avoids Vite inability to handle import attributes)
- a729303: Adds the possibility to load queries using relative module id

## 0.2.5

### Patch Changes

- 53ff270: Makes it possible to loadquery dynamically so that `base` can be passed to import attributes

## 0.2.4

### Patch Changes

- 27e0170: Improve handling of nested `index.html` requests and index page with trailing `/`

## 0.2.3

### Patch Changes

- fb8e73f: When there is no `*.html` file, use an empty layout
- 1945750: Production mode would throw if the server module was not found.
- 022a35d: Page `index.ts` generates a default page handler
- c16c507: Generated patterns include base URL to avoid ambiguous matches

## 0.2.2

### Patch Changes

- ab59491: Gracefully handle pages without `.html.ts` server module
- ee7aea7: Fix exception thrown when page queries are not provided

## 0.2.1

### Patch Changes

- 7738d66: Using new method for controlling `connectedCallback` in SSR

## 0.2.0

### Minor Changes

- 06fc9ca: Updated `@lit-labs/ssr` to v4.1

## 0.1.4

### Patch Changes

- f4f9e47: `runtime` directory was not included in the build

## 0.1.3

### Patch Changes

- 7da764f: Extend vite range to include v8
- Updated dependencies [7da764f]
  - @kopflos-cms/vite@0.3.8

## 0.1.2

### Patch Changes

- 6954423: Log page query times
- b44df93: Trying to improve error handling of executing page queries
- Updated dependencies [44313db]
  - @kopflos-cms/vite@0.3.6

## 0.1.1

### Patch Changes

- a945c57: Pack JS instead of TS
- a945c57: Make the plugin parameter optional

## 0.1.0

### Minor Changes

- 0b9e8af: First release

### Patch Changes

- 5486bac: Re-export `html` from lit for convenience
- 0f66f30: Added `(dis)allowConnectedCallback` arrays to `SsrOptions` to control which elements run `connectedCallback` in the browser.
- Updated dependencies [c9ff747]
  - @kopflos-cms/vite@0.3.5
