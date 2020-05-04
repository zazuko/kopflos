const Hydra = require('alcaeus/with-parsers')
const { rdfs } = require('@tpluscode/rdf-ns-builders')

const baseUrl = 'http://localhost:9000/'

async function getBlog () {
  const blog = await Hydra.loadResource(baseUrl)
  return blog.representation.root
}

getBlog()
  .then(res => console.log(`Blog title: ${res[rdfs.label.value].value}`))
