import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { RequestHandler } from 'express'
import Negotiator from 'negotiator'
import { selectTypes } from './resultTypes.js'

export default function (client: ParsingClient, query: string): RequestHandler {
  return async (req, res) => {
    const negotiator = new Negotiator(req)

    if (!negotiator.mediaType(selectTypes)) {
      res.status(406).send('Not Acceptable')
      return
    }

    const result = await client.query.ask(query)

    res
      .header('content-type', 'application/sparql-results+json')
      .send({
        head: {},
        boolean: result,
      })
  }
}
