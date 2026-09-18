import type { RequestHandler } from 'express'
import Negotiator from 'negotiator'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import { Transform } from 'node:stream'
import type { TransformCallback } from 'stream'
import type { Term } from '@rdfjs/types'
import { selectTypes } from './resultTypes.js'

export default (client: StreamClient, query: string): RequestHandler => (req, res) => {
  const negotiator = new Negotiator(req)

  if (!negotiator.mediaType(selectTypes)) {
    res.status(406).send('Not Acceptable')
    return
  }

  res.type('application/sparql-results+json')

  const results = client.query
    .select(query)
    .pipe(new BindingTransformer())

  let opened = false
  let first = true
  let vars: string[] = []

  const openWithVars = (v: string[]) => {
    if (opened) return
    opened = true
    res.write('{"head":{"vars":')
    res.write(JSON.stringify(v))
    res.write('},"results":{"bindings":[')
  }

  results.on('data', (binding: Record<string, Term>) => {
    if (!opened) {
      const keys = Object.keys(binding || {})
      if (!vars.length) vars = keys
      openWithVars(vars)
    }
    if (!first) {
      res.write(',')
    }
    first = false
    res.write(JSON.stringify(binding))
  })
  results.on('end', () => {
    if (!opened) {
      // No rows at all
      openWithVars(vars)
    }
    res.write(']}}')
    res.end()
  })
  results.on('error', (error) => {
    if (!res.headersSent) res.status(500)
    res.send(error.message)
  })

  // Stop the source if the client disconnects
  req.on('close', () => {
    if (typeof results.destroy === 'function') {
      try {
        results.destroy()
      }
      catch { /* empty */ }
    }
  })
}

class BindingTransformer extends Transform {
  constructor() {
    super({ objectMode: true })
  }

  _transform(binding: Map<string, Term>, encoding: BufferEncoding, callback: TransformCallback) {
    callback(null, Object.fromEntries(
      [...binding.entries()].map(([key, term]) => [key, serializeTerm(term)]),
    ))
  }
}

function serializeTerm(term: Term) {
  if (term.termType === 'NamedNode') {
    return { type: 'uri', value: term.value }
  }
  if (term.termType === 'BlankNode') {
    return { type: 'bnode', value: term.value }
  }
  if (term.termType === 'Literal') {
    return {
      'type': 'literal',
      'value': term.value,
      'datatype': term.datatype.value,
      'xml:lang': term.language || undefined,
    }
  }
  return { type: 'unknown', value: term.value }
}
