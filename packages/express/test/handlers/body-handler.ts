import type { OutgoingHttpHeaders } from 'node:http'
import type { Handler } from '@kopflos-cms/core'
import type { DatasetCore, Stream } from '@rdfjs/types'
import coBody from 'co-body'

const handler: Handler = async function (req) {
  let body: string | DatasetCore | Stream = 'nobody'
  const headers: OutgoingHttpHeaders = {}
  if (req.body) {
    switch (req.query.type) {
      case 'dataset':
        body = await req.body.dataset
        break
      case 'stream':
        body = req.body.quadStream
        break
      case 'pointer':
        body = (await req.body.pointer()).dataset
        break
      case 'json': {
        const parsed = await coBody(req.body.raw)
        body = JSON.stringify({
          bar: parsed.foo,
        })
        headers['content-type'] = 'application/json'
      }
        break
    }
  }

  return {
    status: 200,
    body,
    headers,
  }
}

export default handler
