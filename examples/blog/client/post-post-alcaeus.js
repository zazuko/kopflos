const { Hydra } = require('alcaeus')

const baseUrl = 'http://localhost:9000/'

async function postPost () {
  const resources = await Hydra.loadResource(baseUrl)
  const blog = resources.root
  const createPost = blog.findOperations({ byMethod: 'POST' })[0]

  const response = await createPost.invoke(JSON.stringify({
    '@id': '',
    '@type': 'http://localhost:9000/api/schema/Post',
    'http://www.w3.org/2000/01/rdf-schema#label': 'new post created by alcaeus'
  }))

  console.log(`post created: ${response.xhr.ok}`)
  console.log(`IRI: ${response.xhr.headers.get('location')}`)
}

postPost()
