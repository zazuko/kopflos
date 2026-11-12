import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scenarios } from './fixture.mjs'

function quantile(values, fraction = 0.5) {
  const sorted = values.toSorted((a, b) => a - b)
  const index = (sorted.length - 1) * fraction
  const lower = Math.floor(index)
  return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower)
}

export function summarize(result) {
  return scenarios.filter(scenario => result.trials.some(trial => trial.scenario === scenario.name)).map((scenario) => {
    const variants = Object.fromEntries(['legacy', 'modern'].map((kind) => {
      const trials = result.trials.filter(trial => trial.scenario === scenario.name && trial.kind === kind)
      const samples = trials.flatMap(trial => trial.samples)
      const median = key => quantile(samples.map(sample => sample[key]))
      return [kind, {
        processTrials: trials.length,
        warmSamples: samples.length,
        coldMs: quantile(trials.map(trial => trial.cold.elapsedMs)),
        warmMs: median('elapsedMs'),
        warmP10Ms: quantile(samples.map(sample => sample.elapsedMs), 0.1),
        warmP90Ms: quantile(samples.map(sample => sample.elapsedMs), 0.9),
        appCpuMs: median('cpuMs'),
        endpointCpuMs: median('endpointCpuMs'),
        afterGcHeapMiB: median('retainedHeapMiB'),
        sampledPeakHeapMiB: median('sampledPeakHeapMiB'),
        sampledPeakRssMiB: median('peakRssMiB'),
        processMaxRssMiB: quantile(trials.map(trial => trial.processMaxRssMiB)),
        responseKiB: median('responseBytes') / 1024,
        emittedQuads: median('emitted'),
        uniqueQuads: median('uniqueQuads'),
        queryRequests: median('requests'),
      }]
    }))
    return { ...scenario, ...variants, speedup: variants.legacy.warmMs / variants.modern.warmMs }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(summarize(JSON.parse(readFileSync(process.argv[2], 'utf8'))), null, 2) + '\n')
}
