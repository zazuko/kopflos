# SPARQL Property Path Parser

Antlr4 grammar-based parser for SPARQL 1.1 property paths.

It returns a `clownface-shacl-path` JS object representing the parsed path.

## Usage

```ts
import type { GraphPointer } from 'clownface';
import { parse } from 'sparql-path-parser';
import { findNodes } from 'clownface-shacl-path';

const path = 'schema:image/schema:thumbnail:/schema:url'

// 1. parse the path...
const parsed = parse(path)

// ...use it to find nodes in a graph
let graph: GraphPointer
const nodes = findNodes(parsed, graph)

// 2. or parse to sparqljs algebra
const algebra = parse.toAlgebra(path)
```
