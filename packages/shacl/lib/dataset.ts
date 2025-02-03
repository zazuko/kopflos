import type { Environment } from '@rdfjs/environment/Environment.js'
import type { TraverserFactory } from '@rdfjs/traverser/Factory.js'
import type { MultiPointer } from 'clownface'
import type { DatasetCore, DatasetCoreFactory } from '@rdfjs/types'

export function clone(ptrs: MultiPointer, env: Environment<TraverserFactory | DatasetCoreFactory>) {
  const traverser = env.traverser<DatasetCore>(({ level, quad }) => {
    return level === 0 || quad.subject.termType === 'BlankNode'
  })

  return ptrs.toArray().flatMap(ptr => [...traverser.match(ptr)])
}
