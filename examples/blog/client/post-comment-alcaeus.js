import rdf from './env.js'

const baseUrl = 'http://localhost:9000/'

async function postComment() {
  const resources = await rdf.hydra.loadResource(`${baseUrl}post/1`)
  const post = resources.representation.root
  const comments = post['http://localhost:9000/api/schema/comments']
  const createComment = comments.findOperations({ byMethod: 'POST' })[0]

  const invocation = await createComment.invoke(JSON.stringify({
    '@id': '',
    '@type': 'http://localhost:9000/api/schema/Comment',
    'http://www.w3.org/2000/01/rdf-schema#label': 'new comment created by alcaeus',
  }), {
    'Content-Type': 'application/ld+json',
  })

  console.log(`comment created: ${invocation.response.xhr.ok}`)
  console.log(`IRI: ${invocation.representation.root.id.value}`)
}

postComment()
