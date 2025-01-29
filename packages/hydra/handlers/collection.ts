import merge from '@sindresorhus/merge-streams'
import type { Handler } from '@kopflos-cms/core'
import { constructQuery } from '@hydrofoil/shape-to-query'
import constraints from '@hydrofoil/shape-to-query/constraints.js'
// eslint-disable-next-line import/no-unresolved
import { kl } from '@kopflos-cms/core/ns.js'
import error from 'http-errors'
import { memberQueryShape, totalsQueryShape } from '../lib/queryShapes.js'
import { HydraMemberAssertionConstraint } from '../lib/shaclConstraint/HydraMemberAssertionConstraint.js'
import { isReadable, isWritable } from '../lib/collection.js'

constraints.set(kl['hydra#MemberAssertionConstraintComponent'], HydraMemberAssertionConstraint)

export function get(): Handler {
  return ({ env, subject }) => {
    if (!isReadable(env, subject)) {
      return new error.MethodNotAllowed('Collection is not readable')
    }

    const memberQuery = constructQuery(memberQueryShape({ env, collection: subject }))
    const members = env.sparql.default.stream.query.construct(memberQuery)

    const totalQuery = constructQuery(totalsQueryShape({ env, collection: subject }))
    const totals = env.sparql.default.stream.query.construct(totalQuery)

    return {
      status: 200,
      body: merge([members, totals]),
    }
  }
}

export function post(): Handler {
  return ({ env, subject }) => {
    if (!isWritable(env, subject)) {
      return new error.MethodNotAllowed('Collection is not writable')
    }

    throw new Error('Not implemented')
  }
}
