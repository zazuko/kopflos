const Clownface = require('clownface')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const generateIri = require('./lib/generateIri')
const ns = require('./lib/namespaces')
const rebase = require('./lib/rebase')
const setGraph = require('./lib/setGraph')

async function get (req, res) {
  const resource = new Clownface({ dataset: req.hydra.resource.dataset, term: req.hydra.resource.term })

  // clone resource dataset
  const content = rdf.dataset(req.hydra.resource.dataset)

  // and merge all line datasets into it
  await Promise.all(resource.out(ns.schema.line).map(async line => {
    const lineContent = await req.app.locals.store.read(line.term)

    for (const quad of lineContent) {
      content.add(quad)
    }
  }))

  res.dataset(setGraph(content))
}

async function post (req, res, next) {
  try {
    const rawContent = await req.dataset()

    const resource = new Clownface({ dataset: req.hydra.resource.dataset })

    const tableTerm = req.hydra.resource.term

    const rawRow = new Clownface({ dataset: rawContent }).has(ns.rdf.type)
    const rowTerm = await generateIri(rawRow, tableTerm)

    if (resource.node(rowTerm).out().terms.length > 0) {
      throw new Error(`can't update existing resource ${rowTerm.value} with POST request`)
    }

    const content = rebase(rawContent, rowTerm)

    await req.app.locals.store.write(rowTerm, content)
    await req.app.locals.store.write(tableTerm, rdf.dataset([rdf.quad(tableTerm, ns.schema.line, rowTerm)]))

    res.status(201).set('location', rowTerm.value).end()
  } catch (err) {
    next(err)
  }
}

async function getLine (req, res) {
  res.dataset(setGraph(req.hydra.resource.dataset))
}

async function putLine (req, res, next) {
  try {
    const content = await req.dataset()

    const rowTerm = req.hydra.resource.term

    await req.app.locals.store.write(rowTerm, content, { truncate: true })

    res.status(201).set('location', rowTerm.value).end()
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get,
  post,
  getLine,
  putLine
}
