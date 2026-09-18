import { html } from 'lit'
import parent from '@zazuko/env-node'
import { expand } from '@zazuko/prefixes'
import './TestElement.js'

export default {
  body: () => html`<lit-test-element data-graph="foo"></lit-test-element>`,
  queries: {
    foo: async () => {
      const dataset = parent.dataset()
      const foo = parent.namedNode('http://example.org/foo')
      const schemaTitle = parent.namedNode(expand('schema:title')!)
      dataset.add(parent.quad(foo, schemaTitle, parent.literal('Bar')))
      return dataset.toStream()
    },
  },
}
