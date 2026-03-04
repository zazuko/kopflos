import { consumeEnvironment, consumeFocusNode } from 'lit-rdf/mixins.js'
import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('plaque-button')
export default class extends consumeEnvironment(consumeFocusNode(LitElement)) {
  render() {
    return html`<sl-button variant="primary" pill target="_blank"
                           href="https://readtheplaque.com/plaque/${this.focusNode?.out(this.rdf.ns.schema.identifier)}">See the
      original
    </sl-button>`
  }
}
