import type { Handler } from '@kopflos-cms/core'

const handler = (): Handler => async (req) => {
  return {
    body: req.env.clownface()
      .node(req.subject.term)
      .addOut(req.env.ns.schema.name, 'from handler code')
      .dataset,
    headers: {
      'x-handler': 'get-with-handler.js',
    },
  }
}

export default handler
