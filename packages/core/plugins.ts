import log from './lib/log.js'
import type { KopflosConfig, KopflosPlugin } from './lib/Kopflos.js'

export async function loadPlugins(plugins: KopflosConfig['plugins']): Promise<KopflosPlugin[]> {
  const pluginsCombined = Object.entries({
    '@kopflos-cms/core/plugin/shorthandTerms.js': {},
    ...plugins,
  })

  return Promise.all(pluginsCombined.map(async ([plugin, options]) => {
    log.info('Loading plugin', plugin)

    const pluginFactory = await import(plugin)
    return pluginFactory.default(options)
  }))
}
