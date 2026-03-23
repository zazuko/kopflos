import { html, LitElement } from 'lit'
import parent from '@zazuko/env-node'
import { expand } from '@zazuko/prefixes'
import { property } from 'lit/decorators.js'
import type { AnyPointer } from 'clownface'

class TestElement extends LitElement {
  @property({ type: Object })
  public graph: AnyPointer | undefined

  render() {
    return html`Data: ${this.graph?.out(parent.namedNode(expand('schema:title')!)).value}`
  }
}
customElements.define('lit-test-element', TestElement)

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
