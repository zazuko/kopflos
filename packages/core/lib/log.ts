import anylogger from 'anylogger'
import type { AnyPointer } from 'clownface'
import { isGraphPointer, isLiteral, isNamedNode } from 'is-graph-pointer'
import * as ns from '@zazuko/vocabulary-extras-builders'

const log = anylogger('kopflos')
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
