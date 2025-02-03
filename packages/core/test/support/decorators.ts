import rdf from '@zazuko/env-node'
import type { RequestDecorator } from '../../lib/decorators.js'

export const foo: RequestDecorator = (_, next) => next()

export const bar: RequestDecorator = (_, next) => next()

export const personOnly: RequestDecorator = async (req, next) => next()
personOnly.applicable = (req) => rdf.ns.schema.Person.equals(req.resourceShape.out(rdf.ns.sh.targetClass).term)

export const organizationOnly: RequestDecorator = async (req, next) => next()
organizationOnly.applicable = (req) => rdf.ns.schema.Organization.equals(req.resourceShape.out(rdf.ns.sh.targetClass).term)
