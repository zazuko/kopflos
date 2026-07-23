import { pathToFileURL } from 'node:url'
import { resolve as resolvePath } from 'node:path'
import type { KopflosPlugin } from '@kopflos-cms/core'
import { createLogger } from '@kopflos-cms/logger'

type KopflosPluginConstructor = new (options: unknown) => KopflosPlugin

const log = createLogger('kopflos')

export async function loadPlugins(root: string, plugins: Record<string, unknown> = {}): Promise<KopflosPlugin[]> {
  const pluginsCombined = Object.entries(plugins).filter(([plugin, options]) => {
    if (options === false) {
      log.debug('Skipping disabled plugin', plugin)
      return false
    }

    return true
  })

  return Promise.all(pluginsCombined.map(async ([plugin, options]) => {
    log.info('Loading plugin', plugin)

    let [module, exportName = 'default'] = plugin.split('#')

    // if module is relative, resolve it relative to the root of the project
    if (module.startsWith('.')) {
      module = pathToFileURL(resolvePath(root, module)).href
    }

    const Plugin: KopflosPluginConstructor = (await import(module))[exportName]
    return new Plugin(options)
  }))
}
