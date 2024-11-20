import type { CosmiconfigResult } from 'cosmiconfig'
import { cosmiconfig } from 'cosmiconfig'
import type { KopflosConfig } from '@kopflos-cms/core'

const explorer = cosmiconfig('kopflos')

interface LoadConfig {
  root?: string
  path: string | undefined
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
