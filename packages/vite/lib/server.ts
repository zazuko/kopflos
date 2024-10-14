import { createServer } from 'vite'
import onetime from 'onetime'
import type { Options } from '../index.js'
import { prepareConfig } from './config.js'

export const createViteServer = onetime(async (options: Pick<Options, 'configPath' | 'entrypoints'>) => {
  const config = await prepareConfig(options)
  return createServer(config)
})
