import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { FocusNode, Environment } from 'lit-rdf/controllers.js'

@customElement('plaque-button')
export default class extends LitElement {
  declare focusNode: FocusNode
  declare rdf: Environment

  constructor() {
    super()
    this.focusNode = new FocusNode(this)
    this.rdf = new Environment(this)
  }

  render() {
    return html`<sl-button variant="primary" pill target="_blank"
                           href="https://readtheplaque.com/plaque/${this.focusNode.pointer?.out(this.rdf.value.ns.schema.identifier)}">See the
      original
    </sl-button>`
  }
}
