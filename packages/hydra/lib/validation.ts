import type { HandlerArgs } from '@kopflos-cms/core'
import { isGraphPointer, isNamedNode } from 'is-graph-pointer'
import type { ShapesGraphLoader } from '@kopflos-cms/shacl'

export const shapesGraphLoader: ShapesGraphLoader = ({ env, subject, handler }: HandlerArgs) => {
  const { sh, owl, kl, hydra, rdf } = env.ns

  let memberShape = subject.out(kl('hydra#memberCreateShape'))
  if (!isGraphPointer(memberShape)) {
    memberShape = subject.out(kl('hydra#memberShape'))
  }

  subject
    .blankNode()
    .addOut(rdf.type, sh.NodeShape)
    .addOut(sh.targetNode, subject)
    .addOut(sh.property, prop => {
      prop
        .addOut(sh.path, hydra.member)
        .addOut(sh.maxCount, 1)
        .addOut(sh.minCount, 1)
        .addOut(sh.message, 'Posting to a collection requires a single new hydra:member')
    })

  subject
    .blankNode()
    .addOut(sh.targetObjectsOf, hydra.member)
    .addOut(sh.node, memberShape)

  const shapesGraphs = handler
    .out(sh.shapesGraph)
    .filter(isNamedNode)
  subject
    .blankNode()
    .addOut(owl.imports, shapesGraphs)

  return subject.dataset
}
