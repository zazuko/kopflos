import { isStream } from 'is-stream'
import type { KopflosResponse } from './Kopflos.js'

export function isResponse(arg: unknown): arg is KopflosResponse {
  if (typeof arg !== 'object' || !arg) {
    return false
  }

  return 'body' in arg || 'status' in arg || arg instanceof Error || isStream(arg) || 'size' in arg
}
