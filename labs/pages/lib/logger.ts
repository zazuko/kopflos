import { createLogger as baseLogger } from '@kopflos-cms/logger'

export const logger = baseLogger('pages')

export const createLogger = (name: string) => {
  return baseLogger('pages' + name ? `:${name}` : '')
}
