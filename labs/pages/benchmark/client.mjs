import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { performance } from 'node:perf_hooks'
import { finished } from 'node:stream/promises'
import env from '@zazuko/env-node'
import StreamClient from 'sparql-http-client/StreamClient.js'
import { Generator, Parser } from 'sparqljs'
import { fixture, query } from './fixture.mjs'

const options = JSON.parse(process.argv[2])
// Both variants load their query processors before timing. Only the production
// lazy Comunica import/engine creation remains inside the first modern request.
let Processor, PageUrlTransform, queryClient, createPageUrlExtension
if (options.kind === 'legacy') {
  ;({ default: Processor } = await import(pathToFileURL(`${options.baseline}/SparqlProcessor.ts`)))
  ;({ default: PageUrlTransform } = await import(pathToFileURL(`${options.baseline}/PageUrlTransform.ts`)))
}
else {
  ;({ default: Processor } = await import('../lib/SparqlProcessor.ts'))
  ;({ queryClient } = await import('../lib/queryClient.ts'))
  ;({ createPageUrlExtension } = await import('../lib/pageUrl.ts'))
}
// Build the correctness oracle before timing, then release both datasets.
// Only the endpoint retains input data during application measurements.
const { pages, expectedHash, expectedSize } = (() => {
  const { pages, expected } = fixture(env, options.scenario)
  return { pages, expectedHash: hash(expected), expectedSize: expected.size }
})()
const parsed = new Parser().parse(query(options.kind))
const client = new StreamClient({ endpointUrl: options.url, factory: env })
const metricsUrl = new URL('/metrics', options.url)
const resetUrl = new URL('/reset', options.url)

function hash(dataset) {
  const rows = [...dataset].map(quad => JSON.stringify([
    quad.subject.value, quad.predicate.value, quad.object.termType,
    quad.object.value, quad.object.language, quad.object.datatype?.value,
  ])).sort()
  return createHash('sha256').update(rows.join('\n')).digest('hex')
}

async function execute() {
  await (await fetch(resetUrl)).arrayBuffer()
  global.gc()
  let peak = process.memoryUsage()
  const sample = () => {
    const memory = process.memoryUsage()
    for (const key of ['rss', 'heapUsed', 'external']) peak[key] = Math.max(peak[key], memory[key])
  }
  const timer = setInterval(sample, 5)
  const cpu = process.cpuUsage()
  const start = performance.now()
  let emitted = 0
  let dataset
  try {
    const processor = options.kind === 'legacy' ? new Processor(env, pages) : new Processor(env)
    const rewritten = processor.process(parsed)
    const text = new Generator().stringify(rewritten)
    const source = options.kind === 'legacy'
      ? client.query.construct(text)
      : queryClient(client, processor, createPageUrlExtension(pages, env), env).query.construct(text)
    const result = options.kind === 'legacy' ? source.pipe(new PageUrlTransform(pages, env)) : source
    if (result !== source) source.on('error', error => result.destroy(error))
    result.on('data', () => {
      emitted++
      if (emitted % 512 === 0) sample()
    })
    ;[dataset] = await Promise.all([env.dataset().import(result), finished(result)])
    sample()
  }
  finally {
    clearInterval(timer)
  }
  const elapsedMs = performance.now() - start
  const used = process.cpuUsage(cpu)
  const cpuMs = (used.user + used.system) / 1000
  assert.equal(dataset.size, expectedSize)
  assert.equal(hash(dataset), expectedHash)
  // eslint-disable-next-line no-useless-assignment -- Release results before measuring retained heap.
  dataset = null
  global.gc()
  const retained = process.memoryUsage()
  const endpoint = await (await fetch(metricsUrl)).json()
  return {
    elapsedMs, cpuMs, emitted, uniqueQuads: expectedSize,
    peakRssMiB: peak.rss / 2 ** 20,
    sampledPeakHeapMiB: peak.heapUsed / 2 ** 20,
    retainedHeapMiB: retained.heapUsed / 2 ** 20,
    requests: endpoint.requests.length,
    responseBytes: endpoint.requests.reduce((sum, entry) => sum + entry.bytes, 0),
    endpointCpuMs: endpoint.requests.reduce((sum, entry) => sum + entry.cpuMs, 0),
    endpointRssMiB: endpoint.memory.rss / 2 ** 20,
  }
}

global.gc()
const baseline = process.memoryUsage()
const cold = await execute()
for (let i = 0; i < options.warmup; i++) await execute()
const samples = []
for (let i = 0; i < options.iterations; i++) samples.push(await execute())
process.send({ kind: options.kind, scenario: options.scenario.name, baselineRssMiB: baseline.rss / 2 ** 20, baselineHeapMiB: baseline.heapUsed / 2 ** 20, cold, samples, processMaxRssMiB: process.resourceUsage().maxRSS / 1024 })
