import pretty from '@rdfjs/formats-common'

export const selectTypes = [
  'application/json',
  'application/sparql-results+json',
]

export const graphTypes = [...pretty.serializers.keys()]
