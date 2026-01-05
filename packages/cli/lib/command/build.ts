import log from '@kopflos-cms/logger'
import { loadPlugins } from '@kopflos-cms/core/plugins.js' // eslint-disable-line import/no-unresolved
import { createEnv } from '@kopflos-cms/core/env.js' // eslint-disable-line import/no-unresolved
import { loadConfig } from '../config.js'

interface BuildArgs {
  config?: string
}

export default async function (args: BuildArgs) {
  const { config } = await loadConfig({
    path: args.config,
  })
  const plugins = await loadPlugins(config.plugins)
  const env = createEnv(config)

  log.info('Running build actions...')
  const buildActions = plugins.map(Plugin => Plugin.build?.(env))
  if (buildActions.length === 0) {
    return log.warn('No plugins with build actions found')
  } else {
    await Promise.all(buildActions)
  }
}
