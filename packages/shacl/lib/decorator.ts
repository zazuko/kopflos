import type { HandlerArgs, Kopflos, RequestDecorator, ResultEnvelope } from '@kopflos-cms/core'
import type { ShaclPlugin } from '../index.js'
import type { ValidationCallback } from './validation.js'
import { shaclValidate } from './validation.js'
import { findShapes } from './shapes.js'

export default class implements RequestDecorator {
  plugin: ShaclPlugin

  constructor(kopflos: Kopflos) {
    const plugin = kopflos.getPlugin('@kopflos-cms/shacl')

    if (!plugin) {
      throw new Error('SHACL plugin not found. Did you forget to add it to the config?')
    }

    this.plugin = plugin
  }

  async run(args: HandlerArgs, next: () => Promise<ResultEnvelope>, validate: ValidationCallback = shaclValidate) {
    const validationReport = await validate(args, this.plugin.options.loadDataGraph)

    if (!validationReport.conforms) {
      return {
        status: 400,
        body: validationReport.dataset,
      }
    }

    return next()
  }

  async applicable(args: HandlerArgs) {
    return args.body.isRDF && (await findShapes(args)).terms.length > 0
  }
}
