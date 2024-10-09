import * as fs from 'node:fs'
import { Readable } from 'node:stream'
import type { Handler } from '@kopflos-cms/core'
import mime from 'mime' // eslint-disable-line import/default

interface Options {
  path: string
  stream?: boolean
}

export default (arg: string | Options): Handler => () => {
  let path: string
  let stream: boolean
  if (typeof arg === 'string') {
    path = arg
    stream = false
  } else {
    ({ path, stream = true } = arg)
  }

  const body = stream
    ? Readable.toWeb(fs.createReadStream(path))
    : fs.readFileSync(path).toString()

  return {
    status: 200,
    headers: {
      'Content-Type': mime.getType(path) || 'application/octet-stream',
    },
    body,
  }
}
