import type { TransformCallback } from 'node:stream'
import { Transform } from 'node:stream'
import type { Term } from '@rdfjs/types'
import { serializeTerm } from './serializeTerm.js'

export class SelectResultsTransform extends Transform {
  private _first = true

  constructor(private readonly variables: string[]) {
    super({ objectMode: true })
  }

  _transform(chunk: Record<string, Term>, encoding: BufferEncoding, callback: TransformCallback) {
    if (this._first) {
      this.push('{"head":{"vars":' + JSON.stringify(this.variables) + '},"results":{"bindings":[')
      this._first = false
    } else {
      this.push(',')
    }

    const binding = Object.fromEntries(
      Object.entries(chunk).map(([key, term]) => [key, serializeTerm(term)]),
    )
    this.push(JSON.stringify(binding))
    callback()
  }

  _flush(callback: TransformCallback) {
    if (this._first) {
      this.push('{"head":{"vars":[]},"results":{"bindings":[]}}')
    } else {
      this.push(']}}')
    }
    callback()
  }
}
