const { debug } = require('../log')('resource')

function factory ({ loader }) {
  return async (req, res, next) => {
    let resources = await loader.forClassOperation(req.hydra.term)

    if (resources.length > 1) {
      return next(new Error(`no unique resource found for: <${req.hydra.term.value}>`))
    }

    if (resources.length === 0) {
      resources = await loader.forPropertyOperation(req.hydra.term)
      res.locals.hydra.resourceCandidates = resources

      debug('Multiple resource candidates found')
      return next()
    }

    req.hydra.resource = resources[0]

    if (req.hydra.resource) {
      debug(`IRI: ${req.hydra.resource.term.value}`)
      debug(`types: ${[...req.hydra.resource.types].map(term => term.value).join(' ')}`)
    } else {
      debug(`no matching resource found: ${req.hydra.term.value}`)
    }

    return next()
  }
}

module.exports = factory
