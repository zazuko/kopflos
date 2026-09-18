import pretty from '@rdfjs-elements/formats-pretty'

export const selectTypes = [
  'application/json',
  'application/sparql-results+json',
]

export const graphTypes = [...pretty.serializers.keys()]
