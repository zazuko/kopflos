function get (req, res) {
  res.dataset(req.hydra.resource.dataset)
}

module.exports = {
  get
}
