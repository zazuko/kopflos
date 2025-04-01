import type { HandlerArgs } from '@kopflos-cms/core'
import type { MultiPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'

export function shapeSelector({ env, subject }: HandlerArgs): MultiPointer {
  let memberShape = subject.out(env.ns.kl('hydra#memberCreateShape'))
  if (!isGraphPointer(memberShape)) {
    memberShape = subject.out(env.ns.kl('hydra#memberShape'))
  }

  const collectionShape = subject
    .blankNode()
    .addOut(env.ns.rdf.type, env.ns.sh.NodeShape)
    .addOut(env.ns.sh.targetNode, subject)
    .addOut(env.ns.sh.property, prop => {
      prop
        .addOut(env.ns.sh.path, env.ns.hydra.member)
        .addOut(env.ns.sh.maxCount, 1)
        .addOut(env.ns.sh.minCount, 1)
        .addOut(env.ns.sh.message, 'Posting to a collection requires a single new hydra:member')
    })

  const memberObjectsShape = subject
    .blankNode()
    .addOut(env.ns.sh.targetObjectsOf, env.ns.hydra.member)
    .addOut(env.ns.sh.node, memberShape)

  return subject.node([
    collectionShape.term,
    memberObjectsShape.term,
    ...memberShape.terms,
  ])
}
