---
"@kopflos-cms/core": patch
---

Added support for templated resource shapes. Use `kl:regex` a pattern to match the request URL path. 
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
