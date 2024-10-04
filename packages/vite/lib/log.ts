import anylogger, { type AnyLogger, type BaseLevels } from 'anylogger'

export const log = (anylogger as unknown as AnyLogger<BaseLevels>)('kopflos:vite')
