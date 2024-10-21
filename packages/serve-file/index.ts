import * as fs from 'node:fs'
import { Readable } from 'node:stream'
import type { Handler } from '@kopflos-cms/core'
import mime from 'mime' // eslint-disable-line import/default

interface Options {
  path: string
  stream?: boolean
  contentType?: string
}

export default (arg: string | Options): Handler => () => {
  let path: string
  let stream: boolean
  let contentType: string | undefined
  if (typeof arg === 'string') {
    path = arg
    stream = false
  } else {
    ({ path, stream = true, contentType } = arg)
  }

  const body = stream
    ? Readable.toWeb(fs.createReadStream(path))
    : fs.readFileSync(path).toString()

  return {
    status: 200,
    headers: {
      'Content-Type': contentType || mime.getType(path) || 'application/octet-stream',
    },
    body,
  }
}
