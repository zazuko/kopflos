import type { CosmiconfigResult } from 'cosmiconfig'
import { cosmiconfig } from 'cosmiconfig'
import type { KopflosConfig } from '@kopflos-cms/core'

const explorer = cosmiconfig('kopflos')

export async function loadConfig(path: string): Promise<KopflosConfig> {
  let ccResult: CosmiconfigResult
  if (path) {
    ccResult = await explorer.load(path)
  } else {
    ccResult = await explorer.search(path)
  }

  if (!ccResult) {
    throw new Error('Configuration not found')
  }

  return ccResult.config
}
