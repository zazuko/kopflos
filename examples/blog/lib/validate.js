const httpErrors = require('http-errors')
const ns = require('./namespaces')

// this is a dummy for the actual shacl RDF/JS library which should be implemented
async function shaclValidate (dataset, shape) {
  if (dataset.match(null, ns.rdfs.label, null, null).size === 0) {
    return [new Error('rdfs:label missing')]
  }

  return []
}

async function validate (dataset, shape) {
  const errors = await shaclValidate(dataset, shape)

  if (errors.length > 0) {
    const message = errors.map(err => err.message).join('\n\n')

    throw new httpErrors.BadRequest(message)
  }
}

module.exports = validate
