import type { SubjectHandler } from '@kopflos-cms/core'

export const post = (): SubjectHandler => async (req) => {
  await req.env.sparql.default.stream.store.post(req.body.quadStream, {
    graph: req.subject.term,
  })

  return {
    status: 204,
  }
}
