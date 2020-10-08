const { join } = require('path')
const { URL } = require('url')
const { Router } = require('express')

function factory (api) {
  const router = new Router()

  router.use((req, res, next) => {
    const docUrl = new URL(req.absoluteUrl())

    docUrl.pathname = join(req.baseUrl, api.path)
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
