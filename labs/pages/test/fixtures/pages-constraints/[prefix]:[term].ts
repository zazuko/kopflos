import { schema } from '@tpluscode/rdf-ns-builders'
import { definePage } from '../../../index.js'
import { html } from 'lit'

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
        path: schema.mainEntity,
        pattern: '[prefix][term]',
      },
      {
        path: schema.about,
        pattern: '[prefix]',
      },
    ],
  },
  body() {
    return html``
  },
})
