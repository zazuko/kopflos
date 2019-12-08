const { Router } = require('express')
const { URL } = require('url')

function factory (api) {
  const router = new Router()

  router.use((req, res, next) => {
    const docUrl = new URL(req.absoluteUrl())

    docUrl.pathname = api.path
    docUrl.search = ''

    res.setLink(docUrl.toString(), 'http://www.w3.org/ns/hydra/core#apiDocumentation')

    next()
  })

  router.get(api.path, (req, res) => {
    res.dataset(api.dataset)
  })

  return router
}

module.exports = factory
