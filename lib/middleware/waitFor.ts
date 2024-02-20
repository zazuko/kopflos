import { RequestHandler, Router } from 'express'
import { asyncMiddleware } from 'middleware-async'

export default function waitFor(promise: unknown, factory: () => RequestHandler): RequestHandler {
  let middleware: RequestHandler | null = null

  return asyncMiddleware(async (req, res, next) => {
    await promise

    if (!middleware) {
      middleware = Router().use(factory())
    }

    middleware(req, res, next)
  })
}
