import type { Readable } from 'node:stream'
import type { Request, Response } from 'express'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import type { KopflosEnvironment } from '@kopflos-cms/core'
import accepts from 'accepts'
import { SelectResultsTransform } from './SelectResultsTransform.js'
import { getQueryType, getVariables } from './getQueryType.js'

export interface SparqlClients {
  stream: StreamClient
  parsed: ParsingClient
}

type Formats = KopflosEnvironment['formats']

export async function handleSelect(q: string, clients: SparqlClients, res: Response) {
  res.type('application/sparql-results+json')
  clients.stream.query.select(q)
    .pipe(new SelectResultsTransform(getVariables(q)))
    .pipe(res)
}

export async function handleAsk(q: string, clients: SparqlClients, res: Response) {
  const boolean = await clients.parsed.query.ask(q)
  res.type('application/sparql-results+json').send({ head: {}, boolean })
}

export async function handleConstruct(q: string, clients: SparqlClients, formats: Formats, req: Request, res: Response) {
  const contentTypeOrArr = accepts(req).type([...formats.serializers.keys()])
  if (contentTypeOrArr) {
    const contentType = Array.isArray(contentTypeOrArr) ? contentTypeOrArr[0] : contentTypeOrArr
    const stream = clients.stream.query.construct(q)
    const serializer = formats.serializers.get(contentType)

    if (serializer) {
      return (serializer.import(stream) as Readable).pipe(res)
    }
  }

  throw new Error('No suitable content type found for CONSTRUCT query results or no available parser')
}

export { getQueryType }
