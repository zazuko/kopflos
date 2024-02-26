import rdf from '@zazuko/env-node'
import generateIri from './lib/generateIri.js'
import { schema } from './lib/namespaces.js'
import rebase from './lib/rebase.js'
import validate from './lib/validate.js'

export async function get(req, res) {
  const url = rdf.namedNode(req.absoluteUrl())

  const dataset = await req.hydra.resource.dataset()
  if (req.dataset) {
    const filters = await req.dataset()

    const fromQuad = [...filters.match(null, schema.from, null, null)][0]
    const from = fromQuad && fromQuad.object

    const toQuad = [...filters.match(null, schema.to, null, null)][0]
    const to = toQuad && toQuad.object

    if (from || to) {
      console.log(`date filter: ${from && from.value} - ${to && to.value}`)
    }

    const tagQuads = [...filters.match(null, schema.tag, null, null)]
    const tags = tagQuads.map(tagQuad => tagQuad.object.value)

    if (tags) {
      console.log(`tag filter: ${tags}`)
    }

    dataset.add(rdf.quad(
      req.hydra.term,
      rdf.ns.hydra.view,
      url,
    ))
  }

  res.dataset(dataset)
}

export async function post(req, res, next) {
  try {
    const rawContent = await req.dataset()

    await validate(rawContent)

    const blogTerm = req.hydra.resource.term
    const postTerm = await generateIri(schema.Post, blogTerm)
    const commentsTerm = rdf.namedNode(`${postTerm.value}/comments`)
    const content = rebase(rawContent, postTerm)

    content.add(rdf.quad(postTerm, rdf.ns.dc11.date, rdf.literal((new Date()).toISOString(), rdf.ns.xsd.date)))
    content.add(rdf.quad(postTerm, schema.comments, commentsTerm))

    await req.app.locals.store.write(postTerm, content)
    await req.app.locals.store.write(blogTerm, rdf.dataset([rdf.quad(blogTerm, schema.post, postTerm)]))

    res.status(201).set('location', postTerm.value).end()
  } catch (err) {
    next(err)
  }
}
