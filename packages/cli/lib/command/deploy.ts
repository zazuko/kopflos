import log from '@kopflos-cms/logger'
import { deploy } from '@kopflos-cms/plugin-deploy-resources'
import { createEnv } from '@kopflos-cms/core/env.js' // eslint-disable-line import/no-unresolved
import { loadPlugins } from '@kopflos-cms/core/plugins.js' // eslint-disable-line import/no-unresolved
import { loadConfig } from '../config.js'

interface DeployArgs {
  config?: string
}

export default async function (args: DeployArgs) {
  const { config } = await loadConfig({
    path: args.config,
  })

  const autoDeployPluginConfig = config.plugins?.['@kopflos-cms/plugin-deploy-resources']

  if (!autoDeployPluginConfig) {
    log.error("'@kopflos-cms/plugin-deploy-resources' not found in plugin configuration")
    return process.exit(1)
  }

  if (!autoDeployPluginConfig.paths?.length) {
    log.warn('No resource paths specified. Nothing to deploy')
    return process.exit(1)
  }

  return deploy(autoDeployPluginConfig.paths, createEnv(config), await loadPlugins(config.plugins))
}
