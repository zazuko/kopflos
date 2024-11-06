import anylogger, { type AnyLogger, type BaseLevels } from 'anylogger'

export function createLogger(name?: string) {
  return (anylogger as unknown as AnyLogger<BaseLevels>)(name ? `kopflos:${name}` : 'kopflos')
}

export default createLogger()
