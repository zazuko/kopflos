import log from '@kopflos-cms/logger'
import { loadPlugins } from '@kopflos-cms/core/plugins.js' // eslint-disable-line import/no-unresolved
import { loadConfig } from '../config.js'

interface BuildArgs {
  config?: string
}

export default async function (args: BuildArgs) {
  const { config } = await loadConfig({
    path: args.config,
  })
  const plugins = await loadPlugins(config.plugins)

  log.info('Running build actions...')
  const buildActions = plugins.map(Plugin => Plugin.build?.())
  if (buildActions.length === 0) {
    return log.warn('No plugins with build actions found')
  } else {
    await Promise.all(buildActions)
  }
}
