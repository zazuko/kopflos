import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { Environment, FocusNode } from 'lit-rdf/controllers.js'

@customElement('schema-geo-map-button')
export default class extends LitElement {
  declare focusNode: FocusNode
  declare rdf: Environment

  constructor() {
    super()
    this.focusNode = new FocusNode(this)
    this.rdf = new Environment(this)
  }

  get latitude() {
    return this.focusNode.pointer?.out(this.rdf.value.ns.schema.latitude).value
  }

  get longitude() {
    return this.focusNode.pointer?.out(this.rdf.value.ns.schema.longitude).value
  }

  render() {
    return html`
      <sl-button variant="primary" pill target="_blank"
                 href="http://maps.google.com/maps?&z=21&t=m&q=loc:${this.latitude}+${this.longitude}">
        See on Google Maps
      </sl-button>`
  }
}
