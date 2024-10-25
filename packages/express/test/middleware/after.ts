import type { RequestHandler } from 'express'

export default function (): RequestHandler {
  return (req, res) => {
    res.send('after')
  }
}
