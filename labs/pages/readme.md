# `@kopflos-labs/pages`

## Usage

In kopflos config

1. Add `https://kopflos.described.at/Pages` to `apiGraphs`
2. Add plugin
    ```js
    {
      '@kopflos-labs/pages': {
        api: baseIri + '/api',
        path: url.fileURLToPath(new URL('pages', import.meta.url)),
        ssr: lit,
      }
    }
    ```
