import { resolve, dirname } from 'node:path'
import type { CosmiconfigResult } from 'cosmiconfig'
import { cosmiconfig } from 'cosmiconfig'
import type { KopflosConfig } from '@kopflos-cms/core'

const explorer = cosmiconfig('kopflos')

interface LoadConfig {
  root?: string
  path: string | undefined
}

declare module '@kopflos-cms/core' {
  interface KopflosConfig {
    watch?: string[]
  }
}

export async function loadConfig({ path, root }: LoadConfig): Promise<{ config: KopflosConfig; filepath: string }> {
  let ccResult: CosmiconfigResult
  if (path) {
    ccResult = await explorer.load(path)
  } else {
    ccResult = await explorer.search(root)
  }

  if (!ccResult) {
    throw new Error('Configuration not found')
  }

  return ccResult
}

interface PrepareConfigArgs {
  mode: 'development' | 'production'
  config?: string
  watch: boolean
  variable: Record<string, unknown>
}

export async function prepareConfig({ mode, config, watch, variable }: PrepareConfigArgs) {
  const { config: loadedConfig, filepath } = await loadConfig({
    path: config,
  })

  const watchedPaths = loadedConfig.watch || []

  loadedConfig.plugins = Object.fromEntries(Object.entries(loadedConfig.plugins || {}).map(([plugin, options]) => {
    if (plugin.startsWith('.')) {
      return [resolve(dirname(filepath), plugin), options]
    }

    return [plugin, options]
  }))

  return {
    config: <KopflosConfig>{
      mode,
      ...loadedConfig,
      watch: watch ? [...watchedPaths, filepath] : undefined,
      variables: {
        ...(loadedConfig.variables || {}),
        ...variable,
      },
    },
    configPath: dirname(filepath),
  }
}
