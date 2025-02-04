import type { ValidationReport } from 'rdf-validate-shacl/src/validation-report.js'
import SHACLEngine from 'rdf-validate-shacl'
import type { HandlerArgs } from '@kopflos-cms/core'
import { findShapes, loadShapes } from './shapes.js'

export interface ValidationCallback {
  (args: HandlerArgs): Promise<ValidationReport>
}

export async function shaclValidate(args: HandlerArgs): Promise<ValidationReport> {
  // TODO: do not call findShapes twice
  const shapes = await findShapes(args)
  const shapesGraph = await loadShapes(shapes, args.env)
  const engine = new SHACLEngine(shapesGraph, { factory: args.env })

  return engine.validate(await args.body.dataset)
}
