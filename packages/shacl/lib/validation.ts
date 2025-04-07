import type { ValidationReport } from 'rdf-validate-shacl/src/validation-report.js'
import SHACLEngine from 'rdf-validate-shacl'
import type { HandlerArgs } from '@kopflos-cms/core'
import type { Options } from '../index.js'
import { loadShapesGraph, loadImportTo } from './shapes.js'

export interface ValidationCallback {
  (args: HandlerArgs, loadDataGraph: Options['loadDataGraph']): Promise<ValidationReport>
}

export async function shaclValidate(args: HandlerArgs, loadDataGraph: Options['loadDataGraph'] = dataGraphFromPayload): Promise<ValidationReport> {
  const shapesGraph = await loadShapesGraph(args)
  const engine = new SHACLEngine(shapesGraph, {
    factory: args.env,
    importGraph: loadImportTo(args.env),
  })

  return engine.validate(await loadDataGraph({
    ...args,
    shapesGraph,
  }))
}

function dataGraphFromPayload({ body }: HandlerArgs) {
  return body.dataset
}
