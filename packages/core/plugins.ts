import log from './lib/log.js'
import type { KopflosConfig, KopflosPlugin } from './lib/Kopflos.js'

type KopflosPluginConstructor = new (options: unknown) => KopflosPlugin

export async function loadPlugins(plugins: KopflosConfig['plugins']): Promise<KopflosPlugin[]> {
  const pluginsCombined = Object.entries({
    '@kopflos-cms/core/plugin/shorthandTerms.js': {},
    ...plugins,
  }).filter(([plugin, options]) => {
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
