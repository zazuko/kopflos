const cf = require('clownface')
const ns = require('../namespaces')

async function parseArguments (args, context, loaderRegistry) {
  // is it a list?
  if (args.out(ns.rdf.first).terms.length === 1) {
    return Promise.all([...args.list()].map(arg => parseArgument(arg, context, loaderRegistry)))
  }

  // merge all key value pairs into an object
  const argObject = await args.toArray().reduce(async (p, argNode) => {
    const argsResolved = await p

    argsResolved[argNode.out(ns.p.name).value] = await parseArgument(argNode.out(ns.p.value), context, loaderRegistry)

    return argsResolved
  }, Promise.resolve({}))

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
