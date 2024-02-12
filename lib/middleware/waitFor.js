import { Router } from 'express'
import { asyncMiddleware } from 'middleware-async'

export default function waitFor(promise, factory) {
  let middleware = null

  return asyncMiddleware(async (req, res, next) => {
    await promise

    if (!middleware) {
      middleware = Router().use(factory())
    }

    middleware(req, res, next)
  })
}
