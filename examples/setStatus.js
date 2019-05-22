module.exports = (req, res, next) => {
  res.status(206)
  next()
}
