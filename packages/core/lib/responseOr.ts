import { isStream } from 'is-stream'
import type { KopflosResponse } from './Kopflos.js'

export async function responseOr<T, U>(promise: Promise<T | KopflosResponse> | T | KopflosResponse, next: (arg: T) => Promise<U> | U): Promise<U | KopflosResponse> {
  const responseOrResult = await promise
  if (isResponse(responseOrResult)) {
    return responseOrResult
  }

  return next(responseOrResult)
}

function isResponse(arg: unknown): arg is KopflosResponse {
  if (typeof arg !== 'object' || !arg) {
    return false
  }

  return 'body' in arg || 'status' in arg || arg instanceof Error || isStream(arg)
}
