import { Readable } from 'node:stream'
import type { Request } from 'express'
import type { NamedNode } from '@rdfjs/types'
import type { Body } from '@kopflos-cms/core'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type ClownfaceFactory from 'clownface/Factory.js'
import type { Dataset } from '@zazuko/env/lib/DatasetExt.js'
import type { DatasetFactoryExt } from '@zazuko/env/lib/DatasetFactoryExt.js'
import onetime from 'onetime'

export class BodyWrapper implements Body {
  declare dataset: Promise<Dataset>

  constructor(private readonly env: Environment<DatasetFactoryExt | ClownfaceFactory>, private readonly term: NamedNode, private readonly req: Readable & Pick<Request, 'quadStream'>) {
    Object.defineProperty(this, 'dataset', {
      get: onetime(() => {
        return this.env.dataset().import(this.quadStream)
      }),
    })
  }

  get quadStream() {
    return this.req.quadStream!()
  }

  async pointer() {
    return this.env.clownface({
      dataset: await this.dataset,
      term: this.term,
    })
  }

  get raw() {
    return Readable.toWeb(this.req)
  }
}
