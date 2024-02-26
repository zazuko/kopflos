import { Router } from 'express'
import Api from '../../Api.js'

export default function factory(api: Api) {
  const router = Router()

  router.use((req, res, next) => {
    if (api.term) {
      res.setLink(api.term.value, 'http://www.w3.org/ns/hydra/core#apiDocumentation')
    }

    next()
  })

  router.get(api.path, (req, res, next) => {
    res.dataset(api.dataset).catch(next)
  })

  return router
}
