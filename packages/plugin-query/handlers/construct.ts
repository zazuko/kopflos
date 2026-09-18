import type { RequestHandler } from 'express'
import Negotiator from 'negotiator'
import pretty from '@rdfjs-elements/formats-pretty'
import type { Readable } from 'node:stream'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import { graphTypes } from './resultTypes.js'

export default function (client: StreamClient, query: string): RequestHandler {
  return (req, res, next) => {
    const negotiator = new Negotiator(req)

    const mediaType = negotiator.mediaType(graphTypes)
    if (!mediaType) {
      return res.status(406).send('Not Acceptable')
    }

    const source = client.query.construct(query)
    const out = pretty.serializers.import(mediaType, source) as Readable

    res.type(mediaType)
    out.on('error', next)
    source.on('error', next)

    out.pipe(res)
  }
}
