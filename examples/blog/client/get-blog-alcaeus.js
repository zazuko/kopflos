import rdf from './env.js'

const baseUrl = 'http://localhost:9000/'

async function getBlog() {
  const blog = await rdf.hydra.loadResource(baseUrl)
  return blog.representation.root
}

getBlog()
  .then(res => console.log(`Blog title: ${res[rdf.ns.rdfs.label.value].value}`))
