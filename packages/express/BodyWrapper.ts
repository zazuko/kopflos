import { Readable } from 'node:stream'
import type { Request } from 'express'
import type { NamedNode } from '@rdfjs/types'
import type { Body } from '@kopflos-cms/core'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type ClownfaceFactory from 'clownface/Factory.js'
import type { Dataset } from '@zazuko/env/lib/DatasetExt.js'
import type { DatasetFactoryExt } from '@zazuko/env/lib/DatasetFactoryExt.js'

export class BodyWrapper implements Body {
  private _dataset?: Promise<Dataset>

  constructor(private readonly env: Environment<DatasetFactoryExt | ClownfaceFactory>, private readonly term: NamedNode, private readonly req: Readable & Pick<Request, 'quadStream'>) {

  }

  get dataset(): Promise<Dataset> {
    if (!this._dataset) {
      this._dataset = this.env.dataset().import(this.quadStream)
    }
    return this._dataset
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
