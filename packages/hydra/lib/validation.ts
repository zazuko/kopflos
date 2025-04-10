import type { HandlerArgs, KopflosEnvironment } from '@kopflos-cms/core'
import { isGraphPointer, isNamedNode } from 'is-graph-pointer'
import type { ShapesGraphLoader } from '@kopflos-cms/shacl'
import type { MultiPointer } from 'clownface'
import type { DatasetCore } from '@rdfjs/types'

export const shapesGraphLoader: ShapesGraphLoader = ({ env, subject }: HandlerArgs) => {
  const { sh, owl, kl, hydra, rdf } = env.ns

  let memberShape = subject.out(kl('hydra#memberCreateShape'))
  if (!isGraphPointer(memberShape)) {
    memberShape = subject.out(kl('hydra#memberShape'))
  }

  const shapesGraph = env.clownface()
  copySubgraph(env, memberShape, shapesGraph.dataset)

  shapesGraph
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

  shapesGraph
    .blankNode()
    .addOut(sh.targetObjectsOf, hydra.member)
    .addOut(sh.node, memberShape)

  const imports = subject
    .out(sh.shapesGraph)
    .filter(isNamedNode)
  shapesGraph
    .blankNode()
    .addOut(owl.imports, imports)

  return shapesGraph.dataset
}

function copySubgraph(env: KopflosEnvironment, source: MultiPointer, destination: DatasetCore) {
  const traverser = env.traverser<DatasetCore>(({ level, quad: { subject } }) => {
    return level === 0 || subject.termType === 'BlankNode'
  })

  source.toArray()
    .forEach(ptr => {
      traverser.forEach(ptr, ({ quad }) => {
        destination.add(quad)
      })
    })
}
