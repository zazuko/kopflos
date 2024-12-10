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

export async function prepareConfig({ mode, config, watch, variable }: PrepareConfigArgs): Promise<KopflosConfig> {
  const { config: loadedConfig, filepath: configPath } = await loadConfig({
    path: config,
  })

  const watchedPaths = loadedConfig.watch || []

  return {
    mode,
    ...loadedConfig,
    watch: watch ? [...watchedPaths, configPath] : undefined,
    variables: {
      ...(loadedConfig.variables || {}),
      ...variable,
    },
  }
}
