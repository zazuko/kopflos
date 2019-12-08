const { Hydra } = require('alcaeus')

const baseUrl = 'http://localhost:9000/'

async function postComment () {
  const resources = await Hydra.loadResource(`${baseUrl}post/1`)
  const post = resources.root
  const comments = post['http://localhost:9000/api/schema/comments']
  const createComment = comments.findOperations({ byMethod: 'POST' })[0]

  const response = await createComment.invoke(JSON.stringify({
    '@id': '',
    '@type': 'http://localhost:9000/api/schema/Comment',
    'http://www.w3.org/2000/01/rdf-schema#label': 'new comment created by alcaeus'
  }))

  console.log(`comment created: ${response.xhr.ok}`)
  console.log(`IRI: ${response.xhr.headers.get('location')}`)
}

postComment()
