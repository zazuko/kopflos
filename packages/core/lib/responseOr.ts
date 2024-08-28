import { isStream } from 'is-stream'
import type { KopflosResponse } from './Kopflos.js'
import log from './log.js'

export async function responseOr<T, U>(promise: Promise<T | KopflosResponse> | T | KopflosResponse, next: (arg: T) => Promise<U> | U): Promise<U | KopflosResponse> {
  try {
    const responseOrResult = await promise
    if (isResponse(responseOrResult)) {
      return responseOrResult
    }

    return await next(responseOrResult)
  } catch (e: Error | unknown) {
    log.error(e)
    if (e instanceof Error) {
      return {
        status: 500,
        body: e,
      }
    }

    return {
      status: 500,
      body: new Error('Unknown error'),
    }
  }
}

function isResponse(arg: unknown): arg is KopflosResponse {
  if (typeof arg !== 'object' || !arg) {
    return false
  }

  return 'body' in arg || 'status' in arg || arg instanceof Error || isStream(arg)
}
