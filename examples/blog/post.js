async function get (req, res) {
  res.dataset(await req.hydra.resource.dataset())
}

module.exports = {
  get
}
