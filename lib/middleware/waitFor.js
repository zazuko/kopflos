function waitFor (promise, factory) {
  let middleware = null

  return async (req, res, next) => {
    await promise

    if (!middleware) {
      middleware = factory()
    }

    middleware(req, res, next)
  }
}

module.exports = waitFor
