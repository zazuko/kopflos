/* eslint no-console: off -- Benchmark CLI progress and endpoint errors. */
/* eslint import-x/no-extraneous-dependencies: off, n/no-extraneous-import: off -- Uses the same development installation as the Pages tests. */
/* eslint require-extensions/require-extensions: off, require-extensions/require-index: off -- The plugin uses an API removed in ESLint 10. */
import { createServer } from 'node:http'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { performance } from 'node:perf_hooks'
import env from '@zazuko/env-node'
import { QueryEngine } from '@comunica/query-sparql'
import { fixture } from './fixture.mjs'

const scenario = JSON.parse(process.argv[2])
const { dataset } = fixture(env, scenario)
const engine = new QueryEngine()
let metrics = []
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost')
    if (url.pathname === '/reset') {
      global.gc()
      metrics = []
      response.end('{}')
      return
    }
    if (url.pathname === '/metrics') {
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ requests: metrics, memory: process.memoryUsage(), maxRssKiB: process.resourceUsage().maxRSS }))
      return
    }
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()
    const query = url.searchParams.get('query')
      ?? (request.headers['content-type']?.startsWith('application/sparql-query') ? body : new URLSearchParams(body).get('query'))
    if (!query) {
      response.setHeader('content-type', 'text/turtle')
      response.end('')
      return
    }
    const start = performance.now()
    const cpu = process.cpuUsage()
    const entry = { query, bytes: 0, cpuMs: 0, elapsedMs: 0 }
    metrics.push(entry)
    const result = await engine.query(query, { sources: [dataset] })
    const mediaType = result.resultType === 'quads' ? 'application/n-triples' : 'application/sparql-results+json'
    const serialized = await engine.resultToString(result, mediaType)
    response.setHeader('content-type', mediaType)
    const counter = new Transform({
      transform(chunk, _encoding, callback) {
        entry.bytes += Buffer.byteLength(chunk)
        callback(null, chunk)
      },
    })
    await pipeline(serialized.data, counter, response)
    const used = process.cpuUsage(cpu)
    entry.cpuMs = (used.user + used.system) / 1000
    entry.elapsedMs = performance.now() - start
  }
  catch (error) {
    console.error(error)
    if (!response.headersSent) response.statusCode = 500
    response.end(String(error))
  }
})
server.listen(0, '127.0.0.1', () => {
  process.send({ url: `http://127.0.0.1:${server.address().port}/sparql`, inputQuads: dataset.size })
})
process.on('disconnect', () => server.close())
