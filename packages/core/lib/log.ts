import anylogger from 'anylogger'
import type { AnyPointer } from 'clownface'
import { isGraphPointer, isLiteral, isNamedNode } from 'is-graph-pointer'
import * as ns from '@zazuko/vocabulary-extras-builders'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'

const log = anylogger('kopflos')
const queryLog = anylogger('kopflos:sparql')
export default log

export function logCode(code: AnyPointer, kind: string) {
  if (!log.enabledFor('debug') || !isGraphPointer(code) || isLiteral(code)) {
    return
  }
  if (isNamedNode(code)) {
    return log.debug('Loading %s %s', kind, code.value)
  }
  log.debug('Loading %s from %s', kind, code.out(ns.code.link).value)
}

export function decorateClient<C extends ParsingClient | StreamClient>(client: C): C {
  return new Proxy(client, {
    get(target: C, p: string | symbol) {
      if (p === 'query') {
        return {
          select: queryLogger(target.query.select),
          construct: queryLogger(target.query.construct),
          ask: queryLogger(target.query.ask),
          update: target.query.update,
        }
      }

      return Reflect.get(target, p)
    },
  })
}

function queryLogger<Q extends(query: string) => ReturnType<Q>>(query: Q): Q {
  return ((q: string) => {
    if (queryLog.enabledFor('debug')) {
      queryLog.debug('Executing query %s', q)
    }
    return query(q)
  }) as Q
}
