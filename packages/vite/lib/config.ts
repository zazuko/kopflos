import { glob } from 'glob'
import type { InlineConfig } from 'vite'
import { mergeConfig } from 'vite'
import defaultConfig from '../vite.config.js'
import type { Options } from '../index.js'

export async function prepareConfig({ root, configPath, entrypoints }: Omit<Options, 'mode'>) {
  const input = entrypoints?.flatMap(entry => glob.sync(entry))

  const inputConfig: InlineConfig = {
    root,
    build: {
      outDir: 'dist',
      rollupOptions: {
        input,
      },
    },
  }

  if (configPath) {
    const userConfig = await import(configPath)
    return mergeConfig(defaultConfig, inputConfig, userConfig.default)
  }

  return mergeConfig(defaultConfig, inputConfig)
}
