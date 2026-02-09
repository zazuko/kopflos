import { dirname } from 'node:path'
import type { CosmiconfigResult } from 'cosmiconfig'
import { cosmiconfig } from 'cosmiconfig'
import type { KopflosConfig } from '@kopflos-cms/core'
import { loadPlugins } from './plugins.js'

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

  const { config: { plugins, ...config }, ...rest } = ccResult
  return {
    config: {
      plugins: Array.isArray(plugins) ? plugins : await loadPlugins(plugins),
      ...config,
    },
    ...rest,
  }
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
