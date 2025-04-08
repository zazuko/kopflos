import type { ShapesGraphLoader } from '../../lib/shapes.js'
import { ex } from '../../../testing-helpers/ns.js'

const loader: ShapesGraphLoader = async ({ env }, label?: string, version?: number) => {
  const shape = env.clownface()
    .namedNode(ex.generatedShape)
    .addOut(env.ns.rdf.type, env.ns.sh.NodeShape)
  if (label) {
    shape.addOut(env.ns.rdfs.label, label)
  }
  if (version) {
    shape.addOut(env.ns.schema.version, version)
  }

  return shape.dataset
}

export default loader

export function throws() {
  throw new Error('This is a test error')
}
