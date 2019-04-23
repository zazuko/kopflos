const cf = require('clownface')
const ns = require('../namespaces')

async function parseArguments (args, context, loaderRegistry) {
  // is it a list?
  if (args.out(ns.rdf.first).terms.length === 1) {
    return Promise.all([...args.list()].map(arg => parseArgument(arg, context, loaderRegistry)))
  }

  // or an object?
  const argNodes = args.toArray()
  const promises = argNodes.map((argNode) => parseArgument(argNode.out(ns.p.value), context, loaderRegistry))
  const values = await Promise.all(promises)

  // merge all key value pairs into an object
  const argObject = argNodes.reduce((acc, argNode, idx) => {
    acc[argNode.out(ns.p.name).value] = values[idx]

    return acc
  }, {})

  return [argObject]
}

async function parseArgument (arg, context, loaderRegistry) {
  const code = await loaderRegistry.load(arg, context)

  if (code) {
    return code
  }

  if (arg.term.termType === 'Literal') {
    return arg.value
  }

  return arg
}

module.exports = (term, dataset, { context, loaderRegistry }) => {
  return parseArguments(cf(dataset).node(term).out(ns.code.arguments), context, loaderRegistry)
}
