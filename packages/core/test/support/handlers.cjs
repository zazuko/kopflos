function parametrised (...args) {
  return function () {
    return {
      status: 200,
      body: JSON.stringify(args),
    }
  }
}

module.exports = {
  parametrised,
}
