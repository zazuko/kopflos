# Template processor for kopflos

Renders `<template>` elements in kopflos but running their contents in a templating library.

## Usage

Add to a handler chain to process templates.

Two parameters are required:
1. A `(template: string, graph: MultiPointer): string` function delegate
2. The URL of the resource to render (⚠️ This is bound to change soon ⚠️)

The function is called for every `<template>` element in the document, bottom up. The HTML contents
of the `<template>` element are passed as the `template` parameter. The `graph` parameter is a
[clownface](https://npm.im/clownface) object representing the resource to render. The node which it
represents depend on the nesting of the `<template>` elements.

```turtle
[
  a kl:ResourceShape ;
  kl:handler
    [
      a kl:Handler ;
      kl:method "GET" ;
      code:implementedBy
        (
          # ...previous handlers to prepare the template...
          [
            a code:EcmaScriptModule ;
            code:link <node:@kopflos-labs/html-template#default> ;
            code:arguments
              (
                [ a code:EcmaScriptModule; code:link <node:@kopflos-labs/handlebars#default> ]
                "${uri}"^^code:EcmaScriptTemplateLiteral
              ) ;
          ]
        )
    ] ;
] .
```

## Templating libraries

- [@kopflos-labs/handlebars](https://npm.im/@kopflos-labs/handlebars)

## Writing templates

### Target Class

The `target-class` attribute on the `<template>` element is used to select resources to render from
the `graph`.

The value can be a relative URL, which will be resolved against the API's base IRI.

```html
<!DOCTYPE html>
<html lang="en">
<body>
  <template target-class="/api/schema/Plaque">
    <!-- use a templating library to render instances of /api/schema/Plaque -->
    <div>
      <h1>{{ schema:name }}</h1>
    </div>
  </template>
</body>
</html>
```

### Property Paths

A `<template>` element with `property` attribute is used to drill down into the graph.

```html
<!DOCTYPE html>
<html lang="en">
<body>
  <template target-class="/api/schema/Plaque">
    <template property="schema:image">
      <!-- here the context changes to the image of the plaque resource -->
      <img src="{{ schema:url }}" />
    </template>   
  </template>
</body>
</html>
```
