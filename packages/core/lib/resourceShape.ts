import * as fs from 'node:fs'
import * as path from 'node:path'
import type { NamedNode } from '@rdfjs/types'
import type { Kopflos, KopflosResponse } from './Kopflos.js'
import log from './log.js'

export interface ResourceShapeSubjectMatch {
  api: NamedNode
  resourceShape: NamedNode
  subject: NamedNode
}

export interface ResourceShapePatternMatch {
  api: NamedNode
  resourceShape: NamedNode
  subject: NamedNode
  pattern: string
  subjectVariables: Map<string, string>
}

export interface ResourceShapeObjectMatch {
  api: NamedNode
  resourceShape: NamedNode
  subject: NamedNode
  property: NamedNode
  object: NamedNode
}

export type ResourceShapeMatch = ResourceShapeSubjectMatch | ResourceShapeObjectMatch | ResourceShapePatternMatch

export interface ResourceShapeLookup {
  (iri: NamedNode, instance: Kopflos): Promise<ResourceShapeMatch[] | KopflosResponse>
}

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const select = fs.readFileSync(path.resolve(__dirname, '../query/resourceShapes.rq')).toString()

export default async (iri: NamedNode, instance: Kopflos) => {
  const bindings = await instance.env.sparql.default.parsed.query.select(
    select.replaceAll('sh:this', `<${iri.value}>`),
  )

  bindings.forEach((binding) => {
    if (binding.pattern) {
      const subjectPath = binding.subject.value.substring(instance.env.kopflos.config.baseIri.length)
      const subjectVariables = extractVariables(subjectPath, binding.pattern.value)
      log.debug('Subject variables:', subjectVariables)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      binding.subjectVariables = subjectVariables as any
    }
  })

  return bindings as unknown as ResourceShapeMatch[]
}

function extractVariables(subjectPath: string, pattern: string): Map<string, string> {
  const regex = new RegExp(pattern)
  const matchResult = regex.exec(subjectPath)
  return new Map(Object.entries(matchResult?.groups || {}))
}
