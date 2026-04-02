# @kopflos-cms/in-memory

In-memory oxigraph store for Kopflos.

It provides SPARQL clients that use an in-memory [Oxigraph](https://oxigraph.org/) store. This is useful for development, testing, or small applications that do not require a persistent database.

## Installation

```bash
npm install @kopflos-cms/in-memory
```

## Usage

In your `kopflos.config.ts`, you can use `createInMemoryClients` to configure the default SPARQL endpoint:

```typescript
import { KopflosConfig } from '@kopflos-cms/core'
import { createInMemoryClients } from '@kopflos-cms/in-memory'

export default <KopflosConfig>{
  // ...
  sparql: {
    default: createInMemoryClients(),
  },
  // ...
}
```

### Using an existing Oxigraph store

You can also pass an existing Oxigraph `Store` instance to `createInMemoryClients`:

```typescript
import * as oxigraph from 'oxigraph'
import { createInMemoryClients } from '@kopflos-cms/in-memory'

const store = new oxigraph.Store()
// ... populate store ...

const clients = createInMemoryClients(store)
```

## Features

- Provides both `StreamClient` and `ParsingClient` implementations.
- Supports `SELECT`, `CONSTRUCT`, `ASK`, and `UPDATE` queries.
- Implements `store` interface for `GET`, `POST`, and `PUT` operations.
- All queries executed against the union graph.
