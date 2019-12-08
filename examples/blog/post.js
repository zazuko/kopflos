const setGraph = require('./lib/setGraph')

function get (req, res) {
  res.dataset(setGraph(req.hydra.resource.dataset))
}

module.exports = {
  get
}
