import { PassThrough } from 'node:stream'
import type { Handler } from '@kopflos-cms/core'
import { constructQuery } from '@hydrofoil/shape-to-query'
import constraints from '@hydrofoil/shape-to-query/constraints.js'
// eslint-disable-next-line import/no-unresolved
import { kl } from '@kopflos-cms/core/ns.js'
import { memberQueryShape, totalsQueryShape } from '../lib/queryShapes.js'
import { HydraMemberAssertionConstraint } from '../lib/shaclConstraint/HydraMemberAssertionConstraint.js'

constraints.set(kl.HydraMemberAssertionConstraintComponent, HydraMemberAssertionConstraint)

export function get(): Handler {
  return ({ env, subject }) => {
    const body = new PassThrough({ objectMode: true })

    const memberQuery = constructQuery(memberQueryShape({ env, collection: subject }))
    env.sparql.default.stream.query.construct(memberQuery).pipe(body)

    const totalQuery = constructQuery(totalsQueryShape({ env, collection: subject }))
    env.sparql.default.stream.query.construct(totalQuery).pipe(body)

    return {
      status: 200,
      body,
    }
  }
}
