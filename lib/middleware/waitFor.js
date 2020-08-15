const { Router } = require('express')
const { asyncMiddleware } = require('middleware-async')

function waitFor (promise, factory) {
  let middleware = null

  return asyncMiddleware(async (req, res, next) => {
    await promise

    if (!middleware) {
      middleware = Router().use(factory())
    }

    middleware(req, res, next)
  })
}

module.exports = waitFor
