import { html } from 'lit'
import { definePage } from '../../../lib/Plugin.js'
import './TestElement.js'

export default definePage({
  body: () => html`<lit-test-element data-graph="foo"></lit-test-element>`,
  queries: {
    foo: {
      query: './query/relativeModule.rq',
      importMeta: import.meta,
    },
  },
})
