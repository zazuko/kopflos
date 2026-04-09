import type { Router } from 'express'
import express from 'express'
import type { KopflosPlugin } from '@kopflos-cms/core'
import type Kopflos from '@kopflos-cms/core'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { getQueryType, handleAsk, handleConstruct, handleSelect } from './lib/handlers.js'

export default class QueryPlugin implements KopflosPlugin {
  public readonly name = '@kopflos-cms/plugin-query'

  beforeMiddleware(router: Router, kopflos: Kopflos) {
    const { sparql, formats } = kopflos.env

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
            const q = String(query)
            const type = getQueryType(q)

            switch (type) {
              case 'SELECT':
                return await handleSelect(q, clients, res)
              case 'ASK':
                return await handleAsk(q, clients, res)
              case 'CONSTRUCT':
                return await handleConstruct(q, clients, formats, req, res)
              default:
                res.status(400).send('Unsupported or unknown query form')
            }
          } catch (e: unknown) {
            next(e)
          }
        })
      }
    }
  }
}
