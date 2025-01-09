import type { GraphPointer } from 'clownface'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type ClownfaceFactory from 'clownface/Factory.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import { s2q } from '@hydrofoil/shape-to-query'
import { isGraphPointer } from 'is-graph-pointer'
// eslint-disable-next-line import/no-unresolved
import { kl } from '@kopflos-cms/core/ns.js'
import { log } from '@kopflos-cms/core'

interface MemberQueryShapeArgs {
  env: Environment<ClownfaceFactory | NsBuildersFactory>
  collection: GraphPointer
  limit?: number
  offset?: number
}

export function memberQueryShape({ env, collection, limit, offset }: MemberQueryShapeArgs): GraphPointer {
  const { hydra, sh, rdf } = env.ns

  const shape = collection
    .blankNode()
    .addOut(rdf.type, sh.NodeShape)

  const filterShape = collection.blankNode()
  filterShape.addOut(hydra.memberAssertion, collection.out(hydra.memberAssertion))

  function addFilterShape(nodes: GraphPointer) {
    nodes.addOut(sh.filterShape, filterShape)
  }

  function addOrder(orderBy: GraphPointer) {
    return (nodes: GraphPointer) => {
      nodes
        .addOut(sh.orderBy, orderBy)
        .addOut(sh.nodes, addFilterShape)
    }
  }

  function addOffset(offset: number | undefined) {
    const orderBy = collection.out(sh.orderBy)
    let next = addFilterShape
    if (isGraphPointer(orderBy)) {
      next = addOrder(orderBy)
    } else if (limit || offset) {
      log.warn('LIMIT/OFFSET without order by')
    }

    if (offset) {
      return (nodes: GraphPointer) => {
        nodes
          .addOut(sh.offset, offset)
          .addOut(sh.nodes, next)
      }
    }

    return next
  }

  function addLimit(limit: number | undefined) {
    if (limit) {
      return (nodes: GraphPointer) => {
        nodes
          .addOut(sh.limit, limit)
          .addOut(sh.nodes, addOffset(offset))
      }
    }

    return addOffset(offset)
  }

  shape
    .addOut(sh.target, target => {
      target.addOut(rdf.type, s2q.NodeExpressionTarget)
        .addOut(sh.expression, expression => {
          expression.addOut(sh.distinct, addLimit(limit))
        })
    })

  let memberShape = collection.out(kl['hydra#memberShape'])
  if (!isGraphPointer(memberShape)) {
    memberShape = collection.blankNode()
  }
  memberShape
    .addOut(sh.rule, rule => {
      rule
        .addOut(rdf.type, sh.TripleRule)
        .addOut(sh.predicate, hydra.member)
        .addOut(sh.subject, collection.term)
        .addOut(sh.object, sh.this)
    })
  collection.out(hydra.memberAssertion).forEach(memberAssertion => {
    memberShape.addOut(sh.rule, rule => {
      rule
        .addOut(rdf.type, sh.TripleRule)
        .addOut(sh.subject, memberAssertion.out(hydra.subject).term || sh.this)
        .addOut(sh.predicate, memberAssertion.out(hydra.property).term || sh.this)
        .addOut(sh.object, memberAssertion.out(hydra.object).term || sh.this)
    })
  })

  shape.addList(sh.and, memberShape)

  return shape
}

interface TotalsQueryShapeArgs {
  env: Environment<ClownfaceFactory | NsBuildersFactory>
  collection: GraphPointer
}

export function totalsQueryShape({ env, collection }: TotalsQueryShapeArgs) {
  const { hydra, sh, rdf } = env.ns

  const filterShape = collection.blankNode()
  filterShape.addOut(hydra.memberAssertion, collection.out(hydra.memberAssertion))

  return collection
    .blankNode()
    .addOut(rdf.type, sh.NodeShape)
    .addOut(sh.rule, rule => {
      rule
        .addOut(rdf.type, sh.TripleRule)
        .addOut(sh.subject, collection)
        .addOut(sh.predicate, hydra.totalItems)
        .addOut(sh.object, expr => {
          expr
            .addOut(sh.count, count => {
              count.addOut(sh.distinct, distinct => {
                distinct.addOut(sh.filterShape, filterShape)
              })
            })
        })
    })
}
