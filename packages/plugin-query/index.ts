import type { Router } from 'express'
import express from 'express'
import type { KopflosPlugin } from '@kopflos-cms/core'
import type Kopflos from '@kopflos-cms/core'
import { createProxyMiddleware } from 'http-proxy-middleware'
import yasgui from './handlers/yasgui.js'
import select from './handlers/select.js'
import construct from './handlers/construct.js'
import ask from './handlers/ask.js'
import { Parser } from 'sparqljs'

export default class QueryPlugin implements KopflosPlugin {
  public readonly name = '@kopflos-cms/plugin-query'

  beforeMiddleware(router: Router, kopflos: Kopflos) {
    const { sparql } = kopflos.env

    router.get('/-/query', yasgui(sparql))

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
      }
      else {
        router.all(`/-/query/${name}`, express.json(), express.urlencoded({ extended: true }), async (req, res, next) => {
          const query = req.query.query || req.body.query
          if (!query) {
            return res.status(400).send('Missing query')
          }

          const parser = new Parser({
            factory: kopflos.env,
          })
          const parsed = parser.parse(query)

          if (parsed.type === 'update') {
            return res.status(403).send('Updates are not allowed')
          }

          const { queryType } = parsed
          switch (queryType) {
            case 'SELECT':
              return select(clients.stream, query)(req, res, next)
            case 'CONSTRUCT':
            case 'DESCRIBE':
              return construct(clients.stream, query)(req, res, next)
            case 'ASK':
              return ask(clients.parsed, query)(req, res, next)
            default:
              return res.status(400).send(`Unrecognised query type ${queryType}`)
          }
        })
      }
    }
  }
}
