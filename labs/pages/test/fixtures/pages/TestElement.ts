import { html, LitElement } from 'lit'
import type { AnyPointer } from 'clownface'
import { property } from 'lit/decorators.js'
import { expand } from '@zazuko/prefixes'
import $rdf from '@zazuko/env-node'

class TestElement extends LitElement {
  @property({ type: Object })
  public accessor graph: AnyPointer | undefined

  render() {
    return html`Data: ${this.graph?.out($rdf.namedNode(expand('schema:title')!)).value}`
  }
}

if (!customElements.get('lit-test-element')) {
  customElements.define('lit-test-element', TestElement)
}
