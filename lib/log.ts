import debug0 from 'debug'

const debug = debug0('kopflos:core')

export default (ns: string) => {
  if (ns) {
    return {
      debug: debug.extend(ns),
      warn: debug.extend(ns).extend('warn'),
      error: debug.extend(ns).extend('error'),
    }
  }

  return {
    debug,
    warn: debug.extend('warn'),
    error: debug.extend('error'),
  }
}
