const unsetGraph = require('./lib/unsetGraph')

function get (req, res) {
  res.dataset(unsetGraph(req.hydra.resource.dataset))
}

module.exports = {
  get
}
