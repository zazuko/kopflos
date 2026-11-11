/* eslint no-console: off -- Benchmark CLI progress and endpoint errors. */
/* eslint n/no-unsupported-features/node-builtins: off -- This benchmark targets Node 24. */
/* eslint require-extensions/require-extensions: off, require-extensions/require-index: off -- The plugin uses an API removed in ESLint 10. */
// Run from the repository root:
// node labs/pages/benchmark/run.mjs --output /tmp/pages-benchmark.json
// Native engine: create a temporary venv, install pyoxigraph==0.4.7, then add
// --endpoint oxigraph --python /path/to/venv/bin/python
// Endpoint and each application trial run in separate processes. No deployed
// data is read or changed. The legacy sources are extracted from Git verbatim.
import { fork, spawn, execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import os from 'node:os'
import { scenarios } from './fixture.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const { values } = parseArgs({ options: {
  output: { type: 'string', default: '/tmp/kopflos-pages-benchmark.json' },
  endpoint: { type: 'string', default: 'comunica' },
  python: { type: 'string', default: 'python3' },
  scenario: { type: 'string' },
  trials: { type: 'string', default: '3' },
  iterations: { type: 'string', default: '5' },
  warmup: { type: 'string', default: '1' },
} })
if (!['comunica', 'oxigraph'].includes(values.endpoint)) throw new Error('Endpoint must be comunica or oxigraph')
if (values.scenario && !scenarios.some(scenario => scenario.name === values.scenario)) throw new Error('Unknown scenario')
for (const name of ['trials', 'iterations', 'warmup']) {
  if (!Number.isInteger(Number(values[name])) || Number(values[name]) < (name === 'warmup' ? 0 : 1)) throw new Error(`Invalid ${name}`)
}
const baselineRef = 'c607c70b0a74ea3ccdc21a0256a26d5b5d7f321f'
const baseline = mkdtempSync(join(root, 'node_modules/.cache-pages-benchmark-'))
for (const name of ['SparqlProcessor.ts', 'PageUrlTransform.ts', 'logger.ts']) {
  writeFileSync(join(baseline, name), execFileSync('git', ['show', `${baselineRef}:labs/pages/lib/${name}`], { cwd: root }))
}
const children = new Set()
function child(module, options) {
  const process = fork(fileURLToPath(new URL(module, import.meta.url)), [JSON.stringify(options)], {
    cwd: root, execArgv: ['--expose-gc', '--import', 'tsx'],
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  })
  children.add(process)
  process.on('exit', () => children.delete(process))
  return process
}
function message(process) {
  return new Promise((resolve, reject) => {
    process.once('message', resolve)
    process.once('error', reject)
    process.once('exit', code => reject(new Error(`Benchmark child exited before reporting: ${code}`)))
  })
}
const output = {
  createdAt: new Date().toISOString(),
  baselineRef,
  currentRef: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim(),
  environment: { node: process.version, platform: process.platform, arch: process.arch, cpu: os.cpus()[0].model, cores: os.cpus().length, totalMemoryGiB: os.totalmem() / 2 ** 30 },
  config: values,
  trials: [],
}
try {
  for (const scenario of scenarios.filter(scenario => !values.scenario || scenario.name === values.scenario)) {
    let endpoint, ready
    if (values.endpoint === 'oxigraph') {
      endpoint = spawn(values.python, [fileURLToPath(new URL('./oxigraph_endpoint.py', import.meta.url)), JSON.stringify(scenario)], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] })
      children.add(endpoint)
      endpoint.on('exit', () => children.delete(endpoint))
      ready = new Promise((resolve, reject) => {
        let text = ''
        endpoint.stdout.on('data', (chunk) => {
          text += chunk
          if (text.includes('\n')) resolve(JSON.parse(text.split('\n')[0]))
        })
        endpoint.once('error', reject)
        endpoint.once('exit', code => reject(new Error(`Endpoint exited: ${code}`)))
      })
    }
    else {
      endpoint = child('./endpoint.mjs', scenario)
      ready = message(endpoint)
    }
    const details = await ready
    const { url, inputQuads } = details
    output.endpointEngine = details.engine || 'Comunica 4.5.0'
    console.error(`${scenario.name}: ${inputQuads} input quads, ${scenario.routes} routes`)
    for (let trial = 0; trial < Number(values.trials); trial++) {
      // Alternate variant order to reduce ordering bias.
      for (const kind of trial % 2 ? ['modern', 'legacy'] : ['legacy', 'modern']) {
        const worker = child('./client.mjs', { scenario, kind, url, baseline, iterations: Number(values.iterations), warmup: Number(values.warmup) })
        const result = await message(worker)
        output.trials.push({ trial, ...result })
        worker.disconnect()
        console.error(`  ${kind} trial ${trial + 1}: cold=${result.cold.elapsedMs.toFixed(0)}ms, warm=${result.samples.map(sample => sample.elapsedMs.toFixed(0)).join(',')}ms`)
        writeFileSync(values.output, JSON.stringify(output, null, 2) + '\n')
      }
    }
    if (values.endpoint === 'oxigraph') endpoint.kill()
    else endpoint.disconnect()
  }
}
finally {
  for (const process of children) process.kill()
  rmSync(baseline, { recursive: true, force: true })
}
console.error(`Results: ${values.output}`)
