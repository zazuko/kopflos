import type { RequestHandler } from 'express'

export default function (): RequestHandler {
  return (req, res, next) => {
    if (req.path === '/stop') {
      return res.send('stopped')
    }

    next()
  }
}
