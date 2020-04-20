const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const ns = require('./lib/namespaces')
const rebase = require('./lib/rebase')
const validate = require('./lib/validate')

async function post (req, res, next) {
  try {
    const rawContent = await req.dataset()

    await validate(rawContent)

    const postTerm = req.hydra.resource.term
    const commentsTerm = req.hydra.term
    const commentTerm = rdf.blankNode()
    const content = rebase(rawContent, commentTerm)

    content.add(rdf.quad(commentTerm, ns.dc.date, rdf.literal((new Date()).toISOString(), ns.xsd.date)))
    content.add(rdf.quad(commentsTerm, ns.schema.comment, commentTerm))

    await req.app.locals.store.write(postTerm, content)

    res.status(303).set('location', postTerm.value).end()
  } catch (err) {
    next(err)
  }
}

module.exports = {
  post
}
