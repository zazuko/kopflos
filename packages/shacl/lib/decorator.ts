import type { HandlerArgs, KopflosResponse, RequestDecorator, ResultEnvelope } from '@kopflos-cms/core'
import type { ValidationCallback } from './validation.js'
import { shaclValidate } from './validation.js'
import { findShapes } from './shapes.js'

interface Decorator extends RequestDecorator {
  (args: HandlerArgs, next: () => Promise<ResultEnvelope>, validate?: ValidationCallback): Promise<KopflosResponse> | KopflosResponse
}

export const decorator: Decorator = async (args, next, validate: ValidationCallback = shaclValidate) => {
  const validationReport = await validate(args)

  if (!validationReport.conforms) {
    return {
      status: 400,
      body: 'Invalid request',
    }
  }

  return next()
}

decorator.applicable = async (args) => {
  return args.body.isRDF && (await findShapes(args)).terms.length > 0
}
