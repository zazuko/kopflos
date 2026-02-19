import { resolve } from 'node:path'
import { glob } from 'glob'
import type { InlineConfig } from 'vite'
import { mergeConfig } from 'vite'
import defaultConfig from '../vite.config.js'
import type { BuildConfiguration } from '../index.js'

type ConfigOptions = BuildConfiguration & {
  appRoot: string
  config?: InlineConfig | string
  buildConfig?: InlineConfig
}

export async function prepareConfig({ appRoot, root, entrypoints, outDir, config = {}, buildConfig = {} }: ConfigOptions) {
  const inputConfig: InlineConfig = {
    root,
    build: {
      emptyOutDir: true,
    },
  }
  if (outDir) {
    inputConfig.build!.outDir = resolve(root, outDir)
  }
  if (entrypoints.length > 0) {
    inputConfig.build!.rollupOptions = {
      input: entrypoints.flatMap(entry => glob.sync(resolve(root, entry))),
    }
  }

  let userConfig: InlineConfig = config
  if (typeof config === 'string') {
    if (config.startsWith('.')) {
      config = resolve(appRoot, config)
    }

    userConfig = (await import(config)).default
  }

  return [defaultConfig, inputConfig, userConfig, buildConfig]
    .reduce((merged: InlineConfig, next: InlineConfig) => mergeConfig(merged, next), {})
}
