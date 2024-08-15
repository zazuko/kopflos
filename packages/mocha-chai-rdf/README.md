# `mocha-chai-rdf`

Helpers to simplify testing code which uses RDF/JS data models.

## chai matchers plugin

### Setup

Register the matcher plugin with chai for example in a mocha test setup file:

```js
import chai from 'chai'
import rdfMatchers from 'mocha-chai-rdf/matchers.js'

chai.use(rdfMatchers)
```

### Term equality

```ts
import type { Term } from '@rdfjs/types'
import type { AnyPointer } from 'clownface'
import rdf from '@zazuko/env'

let actual: Term | AnyPointer
expect(actual).term.to.eq(rdf.ns.schema.Person)
```

## Dataset snapshot testing

### Setup

### Usage

```ts
import type { DatasetCore } from '@rdfjs/types'
import 'mocha-chai-rdf/snapshots.js'

let dataset: DatasetCore
expect(dataset).canonical.toMatchSnapshot()
```

## In-memory dataset in mocha tests

### Basic example

In the example below, the call to `createStore` will load the RDF file `test/my-test.spec.ts.ttl` and populate an in-memory store with its contents. The store and other properties are then available in the test suite context under `.rdf` key.

```ts
// test/my-test.spec.ts
import { createStore } from 'mocha-chai-rdf/store.js'

describe('my test suite', () => {
  beforeEach(createStore(import.meta.url))
  
  context('foo', () => {
    context('bar', () => {
      it('should do something', function () {
        // you can access the dataset, graph and store
        // loaded from test fixture RDF file
        let { 
          dataset,       // RDF/JS dataset
          graph,         // clownface graph pointer
          store,         // oxigraph in-memory store
          parsingClient, // sparql-http-client-compatible client which returns parsed results
          streamClient   // sparql-http-client-compatible client which stream results
        } = this.rdf
      })
    })
  })
})
```

### Load graphs from trig dataset files

To load graphs from a trig file, pass the `trig` option:

```ts
beforeEach(createStore(import.meta.url, { format: 'trig' }))
```

This will load a graph named `<foo/bar>` from the trig file. As you see, by default the topmost `describe` block name and the test name itself are omitted.

The titles of `describe/context/it` calls are encoded with to create valid URIs.

You can customize the options:
- include the default graph by adding `includeDefaultGraph: true`
- load all graphs by adding `loadAll: true`
- control the graph name by adding `sliceTestPath: [number, number]`. The default is `[1, -1]` which, as described above, omits the topmost `describe` block name and the test name itself, hence the first and last part are sliced from the array of block titles.
