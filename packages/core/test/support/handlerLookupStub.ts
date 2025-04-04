import rdf from '@zazuko/env-node'
import type { Handler, HandlerLookup } from '../../lib/handler.js'

export default (...implementation: Array<Handler>): HandlerLookup => {
  return () => ({
    pointer: rdf.clownface().blankNode(),
    implementation,
  })
}
