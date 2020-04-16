const { Hydra } = require('alcaeus')

const baseUrl = 'http://localhost:9000/'

async function getBlog () {
  await Hydra.loadResource(baseUrl)
}

getBlog()
