import type { KopflosPlugin } from '@kopflos-cms/core'
import { createLogger } from '@kopflos-cms/logger'

type KopflosPluginConstructor = new (options: unknown) => KopflosPlugin

const log = createLogger('kopflos')

export async function loadPlugins(plugins: Record<string, unknown>): Promise<KopflosPlugin[]> {
  const pluginsCombined = Object.entries(plugins).filter(([plugin, options]) => {
    if (options === false) {
      log.debug('Skipping disabled plugin', plugin)
      return false
    }

    return true
  })

  return Promise.all(pluginsCombined.map(async ([plugin, options]) => {
    log.info('Loading plugin', plugin)

    const [module, exportName = 'default'] = plugin.split('#')

    const Plugin: KopflosPluginConstructor = (await import(module))[exportName]
    return new Plugin(options)
  }))
}
