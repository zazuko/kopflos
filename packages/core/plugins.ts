import log from './lib/log.js'
import type { KopflosConfig, KopflosPluginConstructor } from './lib/Kopflos.js'

export async function loadPlugins(plugins: KopflosConfig['plugins']): Promise<KopflosPluginConstructor[]> {
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

    const pluginFactory = await import(module)
    return pluginFactory[exportName](options)
  }))
}
