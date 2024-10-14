# Handlebars templates in kopflos

Processes handlebars templates in kopflos. Used together with the [@kopflos-labs/html-template](https://npm.im/@kopflos-labs/html-template).

## Setup

Add to a handler chain to process handlebars templates.

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

See [@kopflos-labs/html-template](https://npm.im/@kopflos-labs/html-template) for more general information
on writing templates.

## Template helpers

### `valueof`

Requires exactly one argument which is a named node or SHACL Property Path.

As a named node, it can be a prefixed name known to the `@zazuko/prefixes` package.

Presently, only Sequence Paths are supported.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <template target-class="/api/schema/Plaque">
    <title> {{ valueof 'schema:name' }} ::: Read the Plaque</title>
  </template>
</head>
<body>
  <template target-class="/api/schema/Plaque">
    <h1>{{ valueof 'schema:name' }}</h1>
    <img src="{{ valueof 'schema:image/schema:url' }}" />
  </template>
</body>
</html>
```
