import type { Router } from 'express'
import express from 'express'
import type { KopflosPlugin } from '@kopflos-cms/core'
import type Kopflos from '@kopflos-cms/core'
import { createProxyMiddleware } from 'http-proxy-middleware'
import type { Term } from '@rdfjs/types'

function serializeTerm(term: Term) {
  if (term.termType === 'NamedNode') {
    return { type: 'uri', value: term.value }
  }
  if (term.termType === 'BlankNode') {
    return { type: 'bnode', value: term.value }
  }
  if (term.termType === 'Literal') {
    return {
      type: 'literal',
      value: term.value,
      datatype: term.datatype.value,
      'xml:lang': term.language || undefined,
    }
  }
  return { type: 'unknown', value: term.value }
}

export default class QueryPlugin implements KopflosPlugin {
  public readonly name = '@kopflos-cms/plugin-query'

  beforeMiddleware(router: Router, kopflos: Kopflos) {
    const { sparql } = kopflos.env

    router.get('/-/query', (req, res) => {
      const endpoints = Object.keys(sparql).map(name => ({
        name,
        endpoint: `${req.baseUrl}/-/query/${name}`,
      }))

      const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Kopflos Query</title>
    <link href="https://unpkg.com/@zazuko/yasgui/build/yasgui.min.css" rel="stylesheet" type="text/css" />
    <script src="https://unpkg.com/@zazuko/yasgui/build/yasgui.min.js"></script>
    <style>
      body { margin: 0; }
    </style>
  </head>
  <body>
    <div id="yasgui"></div>
    <script>
      const endpoints = ${JSON.stringify(endpoints)};
      const yasgui = new Yasgui(document.getElementById("yasgui"), {
        endpointCatalogueOptions: {
          getData: () => endpoints,
          keys: [],
        },
      });
    </script>
  </body>
</html>`
      res.send(html)
    })

    for (const [name, clients] of Object.entries(sparql)) {
      const target = clients.parsed.endpointUrl
      if (target) {
        router.use(`/-/query/${name}`, createProxyMiddleware({
          target,
          changeOrigin: true,
          pathRewrite: {
            [`^/-/query/${name}`]: '',
          },
        }))
      } else {
        router.all(`/-/query/${name}`, express.json(), express.urlencoded({ extended: true }), async (req, res, next) => {
          const query = req.query.query || req.body.query
          if (!query) {
            return res.status(400).send('Missing query')
          }

          try {
            const accept = req.headers.accept || 'application/sparql-results+json'
            if (accept.includes('application/sparql-results+json') || accept.includes('application/json')) {
              const results = await clients.parsed.query.select(query)
              const bindings = results.map(binding => {
                return Object.fromEntries(
                  Object.entries(binding).map(([key, term]) => [key, serializeTerm(term)]),
                )
              })
              res.json({
                head: { vars: Object.keys(results[0] || {}) },
                results: { bindings },
              })
            } else {
              // TODO: handle other formats if needed
              res.status(406).send('Not Acceptable')
            }
          } catch (e: unknown) {
            next(e)
          }
        })
      }
    }
  }
}
