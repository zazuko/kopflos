---
"@kopflos-labs/pages": minor
---

Resolve page IRIs during query evaluation with Comunica using `kopflos:pageUrl(resource, relationship)`. Both IRI arguments are required. Replace quad-stream URL rewriting with a compiled route resolver, so page IRIs can be used in filters and throughout CONSTRUCT templates. No match or ambiguous URLs leave BIND variables unbound.

Deprecate `SERVICE kopflos:Pages` with a runtime warning and translate supported triples to the new scalar function. The compatibility syntax no longer enumerates multiple matching pages. Migrate to explicit BIND calls before removal in a future breaking release.
