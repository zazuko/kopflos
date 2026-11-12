import type { Term } from '@rdfjs/types'
import { Parser } from 'sparqljs'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import { clientSourceUrl, sparqlRequest } from './sparqlRequest.js'

function serializeTerm(term: Term) {
  switch (term.termType) {
    case 'NamedNode': return { type: 'uri', value: term.value }
    case 'BlankNode': return { type: 'bnode', value: term.value }
    case 'Literal': return {
      type: 'literal', value: term.value,
      ...(term.language ? { 'xml:lang': term.language } : { datatype: term.datatype.value }),
    }
    default: throw new Error(`Unsupported SPARQL result term: ${term.termType}`)
  }
}

/** Expose a non-HTTP client's query methods without collecting its results. */
export function clientFetch(client: StreamClient): typeof fetch {
  return async (input, init) => {
    const request = await sparqlRequest(input, init)
    if (request.source !== clientSourceUrl) return fetch(request.input, init)
    const { query } = request
    if (!query) return new Response('', { headers: { 'content-type': 'text/turtle' } })
    const parsed = new Parser().parse(query)
    const headers = { 'content-type': 'application/sparql-results+json' }
    if (parsed.type === 'query' && parsed.queryType === 'ASK') {
      return new Response(JSON.stringify({ head: {}, boolean: await client.query.ask(query) }), { headers })
    }
    if (parsed.type !== 'query' || parsed.queryType !== 'SELECT') throw new Error('Page sources support SELECT and ASK queries')

    const variables = new Set(parsed.variables.flatMap(variable =>
      'variable' in variable ? [variable.variable.value] : variable.termType === 'Variable' ? [variable.value] : []))
    const rows = client.query.select(query)
    const chunks = (async function* () {
      yield '{"results":{"bindings":['
      let separator = ''
      for await (const row of rows) {
        // Oxigraph returns Maps; sparql-http-client returns records.
        const entries: [string, Term][] = row instanceof Map ? [...row] : Object.entries(row)
        const binding = Object.fromEntries(entries.map(([name, term]) => {
          variables.add(name)
          return [name, serializeTerm(term)]
        }))
        yield separator + JSON.stringify(binding)
        separator = ','
      }
      // JSON members are unordered. Writing the head last also supports SELECT *
      // and initially unbound variables without retaining previous rows.
      yield `]},"head":{"vars":${JSON.stringify([...variables])}}}`
    })()
    const encoder = new TextEncoder()
    return new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        rows.on('error', error => controller.error(error))
      },
      async pull(controller) {
        const chunk = await chunks.next()
        if (chunk.done) controller.close()
        else controller.enqueue(encoder.encode(chunk.value))
      },
      async cancel() {
        rows.destroy()
        await chunks.return()
      },
    }), { headers })
  }
}
