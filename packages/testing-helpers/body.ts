import type { Readable } from 'node:stream'
import type { NamedNode } from '@rdfjs/types'
import rdf from '@zazuko/env-node'
import type { Dataset } from '@zazuko/env/lib/DatasetExt.js'
import type { Body } from '@kopflos-cms/core'

declare module '@rdfjs/types' {
  interface Stream extends Readable {}
}

export function asBody(dataset: Dataset, term: NamedNode): Body {
  return {
    isRDF: true,
    get quadStream() {
      return dataset.toStream()
    },
    get dataset() {
      return dataset
    },
    async pointer() {
      return rdf.clownface({ dataset, term })
    },
  } as unknown as Body
}
