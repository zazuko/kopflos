import type { ShapesGraphLoader } from '../../lib/shapes.js'
import { ex } from '../../../testing-helpers/ns.js'

const loader: ShapesGraphLoader = async ({ env }) => {
  return env.clownface()
    .namedNode(ex.generatedShape)
    .addOut(env.ns.rdf.type, env.ns.sh.NodeShape)
    .dataset
}

export default loader

export function throws() {
  throw new Error('This is a test error')
}
