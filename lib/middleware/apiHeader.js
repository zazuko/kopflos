const { Router } = require('express')

function factory (api) {
  const router = new Router()

  router.use((req, res, next) => {
    res.setLink(api.term.value, 'http://www.w3.org/ns/hydra/core#apiDocumentation')

    next()
  })

  router.get(api.path, (req, res, next) => {
    res.dataset(api.dataset).catch(next)
  })

  return router
}

module.exports = factory
