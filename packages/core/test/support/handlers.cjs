function parametrised (foo, barbaz) {
  return function () {
    return {
      status: 200,
      body: foo + barbaz.bar + barbaz.baz,
    }
  }
}

module.exports = {
  parametrised,
}
