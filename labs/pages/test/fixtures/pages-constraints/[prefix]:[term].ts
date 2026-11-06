import rdf from '@zazuko/env-node'
import { html } from 'lit'
import { definePage } from '../../../index.js'

export default definePage({
  constraints: {
    prefix: {
      schema: 'http://schema.org/',
      foaf: 'http://xmlns.com/foaf/0.1/',
    },
    term: /^[a-zA-Z0-9_-]+$/,
  },
  shape: {
    property: [
      {
        path: rdf.ns.schema.mainEntity,
        pattern: '[prefix][term]',
      },
      {
        path: rdf.ns.schema.about,
        pattern: '[prefix]',
      },
    ],
  },
  body() {
    return html``
  },
})
