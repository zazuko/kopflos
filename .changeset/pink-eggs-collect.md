---
"@kopflos-cms/core": minor
---

Handlers: Added support for `code:arguments`. Please refer to [rdf-loader-code](https://github.com/zazuko/rdf-loader-code?tab=readme-ov-file#loading-function-arguments) for more information.

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
