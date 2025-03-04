import rdf from '@zazuko/env-node'
import type { RequestDecorator } from '../../lib/decorators.js'

export const foo: RequestDecorator = {
  run: (_, next) => next(),
}

export const bar: RequestDecorator = {
  run: (_, next) => next(),
}

export const personOnly: RequestDecorator = {
  run: (_, next) => next(),
  applicable: (req) => rdf.ns.schema.Person.equals(req.resourceShape.out(rdf.ns.sh.targetClass).term),
}

export const organizationOnly: RequestDecorator = {
  run: (_, next) => next(),
  applicable: (req) => rdf.ns.schema.Organization.equals(req.resourceShape.out(rdf.ns.sh.targetClass).term),
}
