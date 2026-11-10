import PluginDeployResources from '@kopflos-cms/plugin-deploy-resources'
import { createEnv } from '@kopflos-cms/core/env.js'
import { CommanderError } from 'commander'
import { loadConfig } from '../config.js'

interface DeployArgs {
  config?: string
}

export default async function (args: DeployArgs) {
  const { config } = await loadConfig({
    path: args.config,
  })

  const autoDeployPluginConfig = config.plugins?.find(plugin => plugin instanceof PluginDeployResources)

  if (!autoDeployPluginConfig) {
    throw new CommanderError(1, 'PLUGIN_MISSING', "'@kopflos-cms/plugin-deploy-resources' not found in plugin configuration")
  }

  if (!autoDeployPluginConfig.paths?.length) {
    throw new CommanderError(1, 'NO_PATHS_SPECIFIED', 'No resource paths specified. Nothing to deploy')
  }

  return autoDeployPluginConfig.deploy(createEnv(config), config.plugins || [])
}
