const Hydra = require('alcaeus/with-parsers')

const baseUrl = 'http://localhost:9000/'

async function postPost () {
  const post = await Hydra.loadResource(baseUrl)
  const blog = post.representation.root
  const createPost = blog.findOperations({ byMethod: 'POST' })[0]

  const invocation = await createPost.invoke(JSON.stringify({
    '@id': '',
    '@type': 'http://localhost:9000/api/schema/Post',
    'http://www.w3.org/2000/01/rdf-schema#label': 'new post created by alcaeus'
  }), {
    'Content-Type': 'application/ld+json'
  })

  console.log(`post created: ${invocation.response.xhr.ok}`)
  console.log(`IRI: ${invocation.response.xhr.headers.get('location')}`)
}

postPost()
