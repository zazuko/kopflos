import { html, LitElement } from 'lit'

class TestElement extends LitElement {
  private connectedCalled = false

  connectedCallback() {
    this.connectedCalled = true
  }

  render() {
    return html`<p>Connected: ${this.connectedCalled}</p>`
  }
}
customElements.define('test-element', TestElement)

export default {
  body: () => html`<test-element></test-element>`,
  queries: {},
}
