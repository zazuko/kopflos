import express from 'express'

export default (): express.RequestHandler => {
  return express.static('public')
}
