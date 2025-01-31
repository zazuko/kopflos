import merge from '@sindresorhus/merge-streams'
import type { Handler } from '@kopflos-cms/core'
import { constructQuery } from '@hydrofoil/shape-to-query'
import constraints from '@hydrofoil/shape-to-query/constraints.js'
// eslint-disable-next-line import/no-unresolved
import { kl } from '@kopflos-cms/core/ns.js'
import error from 'http-errors'
import { ASK } from '@tpluscode/sparql-builder'
import { memberQueryShape, totalsQueryShape } from '../lib/queryShapes.js'
import { HydraMemberAssertionConstraint } from '../lib/shaclConstraint/HydraMemberAssertionConstraint.js'
import { createMemberIdentifier, prepareMember, saveMember, isReadable, isWritable } from '../lib/collection.js'

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
  return async ({ env, subject, body }) => {
    if (!isWritable(env, subject)) {
      return new error.MethodNotAllowed('Collection is not writable')
    }

    if (!body.isRDF) {
      return new error.BadRequest('Expected RDF payload')
    }

    const payload = await body.pointer()
    const [newMember] = payload.out(env.ns.hydra.member).toArray()

    if (!newMember) {
      return new error.BadRequest('Expected a single hydra:member')
    }

    const createdMember = await createMemberIdentifier({
      env,
      collection: subject,
      member: newMember,
    })

    const graphExistsQuery = ASK`GRAPH ${createdMember} { ?s ?p ?o }`.LIMIT(1).build()
    if (await env.sparql.default.stream.query.ask(graphExistsQuery)) {
      return new error.Conflict(`Resource <${createdMember.value}> already exists`)
    }

    await saveMember(env, prepareMember(env, subject, newMember, createdMember))

    return {
      status: 201,
      headers: {
        Location: `<${createdMember.value}>`,
      },
    }
  }
}
