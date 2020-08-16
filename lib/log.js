const debug = require('debug')('hydra-box')

module.exports = (ns) => {
  if (ns) {
    return {
      debug: debug.extend(ns),
        warn: debug.extend(ns).extend('warn'),
      error: debug.extend(ns).extend('error')
    }
  }

  return {
    debug,
    warn: debug.extend('warn'),
    error: debug.extend('error')
  }
}
