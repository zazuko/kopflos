import { resolve } from 'node:path'
import { glob } from 'glob'
import type { InlineConfig } from 'vite'
import { mergeConfig } from 'vite'
import defaultConfig from '../vite.config.js'
import type { Options } from '../index.js'

type ConfigOptions = Omit<Options, 'mode'> & {
  root: string
  outDir: string
}

export async function prepareConfig({ root, configPath, entrypoints, outDir, config = {} }: ConfigOptions) {
  const inputConfig: InlineConfig = {
    root,
    build: {
      emptyOutDir: true,
    },
  }
  if (outDir) {
    inputConfig.build!.outDir = resolve(root, outDir)
  }
  if (entrypoints) {
    inputConfig.build!.rollupOptions = {
      input: entrypoints.flatMap(entry => glob.sync(entry)),
    }
  }

  if (configPath) {
    const userConfig = await import(configPath)
    return mergeConfig(mergeConfig(defaultConfig, inputConfig), userConfig.default)
  }

  return mergeConfig(config, mergeConfig(defaultConfig, inputConfig))
}
