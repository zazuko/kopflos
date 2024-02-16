import rdf from '@zazuko/env-node'
import { schema } from './lib/namespaces.js'
import validate from './lib/validate.js'
import rebase from './lib/rebase.js'

export async function post(req, res, next) {
  try {
    const rawContent = await req.dataset()

    await validate(rawContent)

    const postTerm = req.hydra.resource.term
    const commentsTerm = req.hydra.term
    const commentTerm = rdf.blankNode()
    const content = rebase(rawContent, commentTerm)

    content.add(rdf.quad(commentTerm, rdf.ns.dc11.date, rdf.literal((new Date()).toISOString(), rdf.ns.xsd.date)))
    content.add(rdf.quad(commentsTerm, schema.comment, commentTerm))

    await req.app.locals.store.write(postTerm, content)

    res.status(303).set('location', postTerm.value).end()
  } catch (err) {
    next(err)
  }
}
