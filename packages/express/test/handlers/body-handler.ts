import type { Handler } from '@kopflos-cms/core'
import type { DatasetCore, Stream } from '@rdfjs/types'

const handler: Handler = async function (req) {
  let body: string | DatasetCore | Stream = 'nobody'
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
    }
  }

  return {
    status: 200,
    body,
  }
}

export default handler
