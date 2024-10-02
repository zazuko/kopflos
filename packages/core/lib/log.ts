import type { AnyLogger, BaseLevels } from 'anylogger'
import anylogger from 'anylogger'
import type { AnyPointer } from 'clownface'
import { isGraphPointer, isLiteral, isNamedNode } from 'is-graph-pointer'
import * as ns from '@zazuko/vocabulary-extras-builders'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'

const log = (anylogger as unknown as AnyLogger<BaseLevels>)('kopflos')
const queryLog = (anylogger as unknown as AnyLogger<BaseLevels>)('kopflos:sparql')
export default log

export function logCode(code: AnyPointer, kind: string) {
  if (!log.enabledFor('debug') || !isGraphPointer(code) || isLiteral(code)) {
    return
  }
  if (isNamedNode(code)) {
    return log.debug(`Loading ${kind} ${code.value}`)
  }
  log.debug(`Loading ${kind} from ${code.out(ns.code.link).value}`)
}

export function decorateClient<C extends ParsingClient | StreamClient>(client: C): C {
  return new Proxy(client, {
    get(target: C, p: string | symbol) {
      if (p === 'query') {
        return {
          select: queryLogger(target.query.select.bind(target.query)),
          construct: queryLogger(target.query.construct.bind(target.query)),
          ask: queryLogger(target.query.ask.bind(target.query)),
          update: target.query.update.bind(target.query),
        }
      }

      return Reflect.get(target, p)
    },
  })
}

function queryLogger<Q extends(query: string) => ReturnType<Q>>(query: Q): Q {
  return ((q: string) => {
    if (queryLog.enabledFor('trace')) {
      queryLog.trace('Executing query', q)
    }
    return query(q)
  }) as Q
}
