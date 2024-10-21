import { resolve } from 'node:path'
import { glob } from 'glob'
import type { InlineConfig } from 'vite'
import { mergeConfig } from 'vite'
import defaultConfig from '../vite.config.js'
import type { Options } from '../index.js'

export async function prepareConfig({ root, configPath, entrypoints, outDir = 'dist' }: Omit<Options, 'mode'>) {
  const inputConfig: InlineConfig = {
    root,
    build: {
      outDir: resolve(process.cwd(), outDir),
      emptyOutDir: true,
    },
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

  return mergeConfig(defaultConfig, inputConfig)
}
