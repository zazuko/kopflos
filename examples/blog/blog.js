const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const { dc11, xsd } = require('@tpluscode/rdf-ns-builders')
const generateIri = require('./lib/generateIri')
const ns = require('./lib/namespaces')
const rebase = require('./lib/rebase')
const validate = require('./lib/validate')

async function get (req, res) {
  if (req.dataset) {
    const filters = await req.dataset()

    const fromQuad = [...filters.match(null, ns.schema.from, null, null)][0]
    const from = fromQuad && fromQuad.object

    const toQuad = [...filters.match(null, ns.schema.to, null, null)][0]
    const to = toQuad && toQuad.object

    if (from || to) {
      console.log(`filter: ${from && from.value} - ${to && to.value}`)
    }
  }

  res.dataset(req.hydra.resource.dataset)
}

async function post (req, res, next) {
  try {
    const rawContent = await req.dataset()

    await validate(rawContent)

    const blogTerm = req.hydra.resource.term
    const postTerm = await generateIri(ns.schema.Post, blogTerm)
    const commentsTerm = rdf.namedNode(`${postTerm.value}/comments`)
    const content = rebase(rawContent, postTerm)

    content.add(rdf.quad(postTerm, dc11.date, rdf.literal((new Date()).toISOString(), xsd.date)))
    content.add(rdf.quad(postTerm, ns.schema.comments, commentsTerm))

    await req.app.locals.store.write(postTerm, content)
    await req.app.locals.store.write(blogTerm, rdf.dataset([rdf.quad(blogTerm, ns.schema.post, postTerm)]))

    res.status(201).set('location', postTerm.value).end()
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get,
  post
}
