import { html, LitElement } from 'lit'
import parent from '@zazuko/env-node'
import { expand } from '@zazuko/prefixes'
import { property } from 'lit/decorators.js'
import type { AnyPointer } from 'clownface'
import { definePage } from '../../../lib/Plugin.js'

class TestElement extends LitElement {
  @property({ type: Object })
  public graph: AnyPointer | undefined

  render() {
    return html`Data: ${this.graph?.out(parent.namedNode(expand('schema:title')!)).value}`
  }
}
customElements.define('lit-test-element', TestElement)

export default definePage({
  body: () => html`<lit-test-element data-graph="foo"></lit-test-element>`,
  queries: {
    foo: {
      query: './query/relativeModule.rq',
      importMeta: import.meta,
    },
  },
})
